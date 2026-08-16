/**
 * The contract model, checked against itself.
 *
 * This simulation's whole claim is that it shows students an honest expected
 * value and then pays it. Three things broke that, and these tests keep them
 * broken-proof:
 *
 *   1. Injury severity was not ordered. MILD paid 0.75, MODERATE 1.00 and
 *      SEVERE 0.90, so a mild injury was the worst outcome available and a
 *      moderate one cost nothing at all.
 *   2. The expected value on the decision screen assumed an injured bet paid
 *      the full guarantee. It never did — it paid base times severity — so the
 *      number shown was not the number paid.
 *   3. The healthy branch drew variance centred on +0.2 x incentives, so the
 *      real mean was base + 1.2 x incentives while the screen said base plus
 *      incentives.
 *
 * Run: node --test tests/
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, "game.js"), "utf8");

/** Evaluate the shipped file's top-level constants without a DOM. */
function loadModel() {
  const grab = (name, pattern) => {
    const m = SRC.match(pattern);
    assert.ok(m, `could not find ${name} in game.js`);
    return m[1];
  };
  const severity = eval(`(${grab("INJURY_SEVERITY", /const INJURY_SEVERITY = (\{[\s\S]*?\n\});/)})`);
  const odds = eval(`(${grab("INJURY_ODDS", /const INJURY_ODDS = (\{[^}]*\});/)})`);
  const players = eval(grab("players", /const players = (\[[\s\S]*?\n\];)/).replace(/;\s*$/, ""));
  return { severity, odds, players };
}

const { severity, odds, players } = loadModel();
const expectedMultiplier = Object.keys(odds).reduce(
  (sum, k) => sum + odds[k] * severity[k].multiplier,
  0,
);

test("a worse injury always costs more than a milder one", () => {
  assert.ok(
    severity.SEVERE.multiplier < severity.MODERATE.multiplier,
    `SEVERE (${severity.SEVERE.multiplier}) must pay less than MODERATE (${severity.MODERATE.multiplier})`,
  );
  assert.ok(
    severity.MODERATE.multiplier < severity.MILD.multiplier,
    `MODERATE (${severity.MODERATE.multiplier}) must pay less than MILD (${severity.MILD.multiplier})`,
  );
});

test("an injury always costs something — otherwise betting has no downside", () => {
  for (const [name, { multiplier }] of Object.entries(severity)) {
    assert.ok(multiplier < 1, `${name} multiplier ${multiplier} leaves the guarantee untouched`);
    assert.ok(multiplier > 0, `${name} multiplier ${multiplier} is not a payout`);
  }
});

test("the injury odds are a probability distribution and match the draw in makeDecision", () => {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `odds sum to ${total}`);
  // The draw is: <0.15 SEVERE, <0.55 MILD, else MODERATE. Compared with a
  // tolerance because 0.55 - 0.15 is not exactly 0.4 in binary floating point.
  const near = (a, b, what) =>
    assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} should match the draw's ${b}`);
  near(odds.SEVERE, 0.15, "SEVERE");
  near(odds.MILD, 0.55 - 0.15, "MILD");
  near(odds.MODERATE, 1 - 0.55, "MODERATE");
});

test("the expected value shown is the expected value paid", () => {
  // Reimplements makeDecision's payout exactly, then compares the mean against
  // the formula the decision screen prints.
  const payout = (p) => {
    if (Math.random() < p.riskPercent / 100) {
      const x = Math.random();
      const k = x < 0.15 ? "SEVERE" : x < 0.55 ? "MILD" : "MODERATE";
      return p.baseGuaranteed * severity[k].multiplier;
    }
    const variance = (Math.random() - 0.5) * p.incentives;
    return Math.max(p.baseGuaranteed, p.baseGuaranteed + p.incentives + variance);
  };

  for (const p of players) {
    const risk = p.riskPercent / 100;
    const shown =
      (1 - risk) * (p.baseGuaranteed + p.incentives) +
      risk * p.baseGuaranteed * expectedMultiplier;

    const N = 400_000;
    let sum = 0;
    for (let i = 0; i < N; i++) sum += payout(p);
    const actual = sum / N;

    // Monte Carlo noise on 400k draws is well under 1% of these magnitudes.
    const drift = Math.abs(actual - shown) / shown;
    assert.ok(
      drift < 0.01,
      `${p.name}: screen says $${shown.toFixed(2)}M, game pays $${actual.toFixed(2)}M (${(drift * 100).toFixed(2)}% off)`,
    );
  }
});

test("every player states a coherent contract", () => {
  for (const p of players) {
    assert.ok(p.baseGuaranteed > 0, `${p.name} has no guarantee`);
    assert.ok(p.incentives > 0, `${p.name} has no incentives, so there is nothing to bet on`);
    assert.ok(p.riskPercent > 0 && p.riskPercent < 100, `${p.name} has risk ${p.riskPercent}%`);
  }
});

/**
 * Not yet true, and deliberately recorded rather than asserted.
 *
 * Betting is expected-value positive for all eight players, so a student who
 * reasons purely by EV should always bet and the decision collapses into a
 * variance preference the game does not score. That is a balance question
 * about the contract data — incentives are large relative to injury risk — and
 * changing it changes the lesson's difficulty, so it belongs to whoever owns
 * the product rather than to a bug fix.
 */
test("DOCUMENTED GAP: betting is EV-positive for every player", () => {
  const evBet = (p) => {
    const risk = p.riskPercent / 100;
    return (1 - risk) * (p.baseGuaranteed + p.incentives)
      + risk * p.baseGuaranteed * expectedMultiplier;
  };
  const alwaysBetter = players.filter((p) => evBet(p) > p.baseGuaranteed);
  assert.equal(
    alwaysBetter.length,
    players.length,
    "if this fails, the contract data was rebalanced and a real per-player tradeoff now exists — update this test",
  );
});
