import assert from "node:assert/strict";
import { test } from "node:test";
import { draw, isValidDraw, type Pair } from "./draw";

const family = ["mom", "dad", "alice", "bob", "carol", "dave"];
const couples: Pair[] = [
  ["mom", "dad"],
  ["alice", "bob"],
  ["carol", "dave"],
];

test("everyone gives and receives exactly once, never to themselves", () => {
  for (let i = 0; i < 200; i++) {
    const result = draw(family, []);
    assert.ok(result);
    assert.ok(isValidDraw(family, [], result));
  }
});

test("exclusions are respected in both directions", () => {
  for (let i = 0; i < 500; i++) {
    const result = draw(family, couples);
    assert.ok(result);
    assert.ok(isValidDraw(family, couples, result));
    assert.notEqual(result.get("mom"), "dad");
    assert.notEqual(result.get("dad"), "mom");
  }
});

test("every allowed receiver comes up for a giver over many draws", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) seen.add(draw(family, couples)!.get("mom")!);
  assert.deepEqual([...seen].sort(), ["alice", "bob", "carol", "dave"]);
});

test("returns null when no valid draw exists", () => {
  assert.equal(draw(["a"], []), null);
  assert.equal(draw(["a", "b"], [["a", "b"]]), null);
  // c can't give to a or b, and must not give to themselves.
  assert.equal(
    draw(
      ["a", "b", "c"],
      [
        ["a", "c"],
        ["b", "c"],
      ],
    ),
    null,
  );
});

test("finds the only possible draw when heavily constrained", () => {
  // Everyone except a ring a→b→c→d→a is excluded.
  const ids = ["a", "b", "c", "d"];
  const ex: Pair[] = [
    ["a", "c"],
    ["b", "d"],
  ];
  for (let i = 0; i < 50; i++) {
    const result = draw(ids, ex);
    assert.ok(result);
    assert.ok(isValidDraw(ids, ex, result));
  }
});

test("handles a larger group with many exclusions", () => {
  const ids = Array.from({ length: 40 }, (_, i) => `p${i}`);
  const ex: Pair[] = [];
  for (let i = 0; i < 40; i += 2) ex.push([`p${i}`, `p${i + 1}`]);
  const result = draw(ids, ex);
  assert.ok(result);
  assert.ok(isValidDraw(ids, ex, result));
});
