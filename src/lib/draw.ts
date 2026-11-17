/**
 * Secret Santa draw: gives every participant exactly one person to buy for, such that nobody
 * gets themselves, nobody is given an excluded partner (in either direction), and everybody
 * receives exactly one gift.
 *
 * Tries uniformly random shuffles first (so every valid draw is equally likely in the common,
 * lightly-constrained case), then falls back to an exhaustive randomized search, which also
 * proves when no valid draw exists.
 */

export type Pair = readonly [string, string];

/** Returns giver → receiver, or null when the exclusions make a valid draw impossible. */
export function draw(ids: readonly string[], exclusions: readonly Pair[], random: () => number = Math.random) {
  if (ids.length < 2) return null;
  const blocked = blockedSet(exclusions);
  const allowed = (giver: string, receiver: string) => giver !== receiver && !blocked.has(key(giver, receiver));

  for (let attempt = 0; attempt < 2000; attempt++) {
    const receivers = shuffle(ids, random);
    if (ids.every((giver, i) => allowed(giver, receivers[i]))) {
      return new Map(ids.map((giver, i) => [giver, receivers[i]]));
    }
  }
  return search(ids, allowed, random);
}

/** Exhaustive backtracking, most-constrained giver first, candidates in random order. */
function search(ids: readonly string[], allowed: (g: string, r: string) => boolean, random: () => number) {
  const options = new Map(ids.map((g) => [g, ids.filter((r) => allowed(g, r))]));
  if ([...options.values()].some((o) => o.length === 0)) return null;
  const givers = shuffle(ids, random).sort((a, b) => options.get(a)!.length - options.get(b)!.length);
  const taken = new Set<string>();
  const result = new Map<string, string>();
  let steps = 0;

  function place(i: number): boolean {
    if (i === givers.length) return true;
    if (++steps > 2_000_000) throw new Error("Draw search took too long");
    const giver = givers[i];
    for (const receiver of shuffle(options.get(giver)!, random)) {
      if (taken.has(receiver)) continue;
      taken.add(receiver);
      result.set(giver, receiver);
      if (place(i + 1)) return true;
      taken.delete(receiver);
      result.delete(giver);
    }
    return false;
  }

  return place(0) ? result : null;
}

/** True when a draw result is valid for these people and exclusions. */
export function isValidDraw(ids: readonly string[], exclusions: readonly Pair[], result: Map<string, string>) {
  const blocked = blockedSet(exclusions);
  const receivers = new Set(result.values());
  return (
    result.size === ids.length &&
    receivers.size === ids.length &&
    ids.every((g) => {
      const r = result.get(g);
      return r !== undefined && r !== g && receivers.has(r) && ids.includes(r) && !blocked.has(key(g, r));
    })
  );
}

function blockedSet(exclusions: readonly Pair[]) {
  const set = new Set<string>();
  for (const [a, b] of exclusions) {
    set.add(key(a, b));
    set.add(key(b, a));
  }
  return set;
}

function key(a: string, b: string) {
  return `${a}\u0000${b}`;
}

function shuffle<T>(items: readonly T[], random: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
