import { describe, expect, it } from "vitest";
import { applyAward, applyRedeem, RewardNotEarnedError } from "./progress";
import type { PointsConfig, StampConfig, StepsConfig } from "@/types";

const stampConfig: StampConfig = {
  stamps_required: 5,
  reward_description: "Free coffee",
  icon: "coffee",
  primary_color: "#000",
  secondary_color: "#fff",
};

const pointsConfig: PointsConfig = {
  points_per_reward: 100,
  reward_description: "Free item",
  points_label: "pts",
  primary_color: "#000",
  secondary_color: "#fff",
};

const stepsConfig: StepsConfig = {
  stages: [
    { key: "bronze", threshold: 3, label: "Bronze reward" },
    { key: "silver", threshold: 6, label: "Silver reward" },
  ],
  primary_color: "#000",
  secondary_color: "#fff",
};

describe("applyAward — stamp", () => {
  it("adds one stamp and caps at stamps_required", () => {
    const r = applyAward("stamp", stampConfig, { stamps_collected: 4 });
    expect(r.progress).toEqual({ stamps_collected: 5 });
    expect(r.resultedInReward).toBe(true);

    const capped = applyAward("stamp", stampConfig, { stamps_collected: 5 });
    expect(capped.progress).toEqual({ stamps_collected: 5 });
  });

  it("does not unlock a reward before the threshold", () => {
    const r = applyAward("stamp", stampConfig, { stamps_collected: 1 });
    expect(r.resultedInReward).toBe(false);
  });
});

describe("applyAward — points", () => {
  it("adds the given amount, defaulting to 1", () => {
    expect(applyAward("points", pointsConfig, { points: 0 }).progress).toEqual({ points: 1 });
    expect(applyAward("points", pointsConfig, { points: 0 }, 25).progress).toEqual({ points: 25 });
  });

  it("unlocks a reward once points_per_reward is reached", () => {
    const r = applyAward("points", pointsConfig, { points: 90 }, 10);
    expect(r.resultedInReward).toBe(true);
  });
});

describe("applyAward — steps", () => {
  it("advances current_value but does not mutate completed_stage_keys", () => {
    const r = applyAward("steps", stepsConfig, { current_value: 2, completed_stage_keys: [] }, 1);
    expect(r.progress).toEqual({ current_value: 3, completed_stage_keys: [] });
    expect(r.resultedInReward).toBe(true); // bronze threshold (3) just reached
  });

  it("does not re-flag a reward for an already-completed stage", () => {
    const r = applyAward(
      "steps",
      stepsConfig,
      { current_value: 3, completed_stage_keys: ["bronze"] },
      0
    );
    expect(r.resultedInReward).toBe(false);
  });
});

describe("applyRedeem — server-side reward-threshold enforcement (P0-4)", () => {
  // These are the exact three cases that were previously silently accepted:
  // a client (or a replayed/forged scan request) could call the redeem
  // action for a customer who had NOT reached the threshold, and the old
  // code would happily reset their progress and record a redemption anyway.
  it("stamp: rejects redemption below stamps_required", () => {
    expect(() => applyRedeem("stamp", stampConfig, { stamps_collected: 4 })).toThrow(
      RewardNotEarnedError
    );
  });

  it("points: rejects redemption below points_per_reward", () => {
    expect(() => applyRedeem("points", pointsConfig, { points: 99 })).toThrow(
      RewardNotEarnedError
    );
  });

  it("steps: rejects redemption of a stage whose threshold hasn't been reached", () => {
    expect(() =>
      applyRedeem("steps", stepsConfig, { current_value: 2, completed_stage_keys: [] })
    ).toThrow(RewardNotEarnedError);
  });

  it("stamp: allows redemption once the threshold is met, resetting to 0", () => {
    const r = applyRedeem("stamp", stampConfig, { stamps_collected: 5 });
    expect(r.progress).toEqual({ stamps_collected: 0 });
    expect(r.rewardDescription).toBe("Free coffee");
  });

  it("points: allows redemption once the threshold is met, deducting the cost", () => {
    const r = applyRedeem("points", pointsConfig, { points: 150 });
    expect(r.progress).toEqual({ points: 50 });
  });

  it("steps: allows redemption once the next stage's threshold is met", () => {
    const r = applyRedeem("steps", stepsConfig, { current_value: 3, completed_stage_keys: [] });
    expect(r.progress).toEqual({ current_value: 3, completed_stage_keys: ["bronze"] });
    expect(r.rewardDescription).toBe("Bronze reward");
  });

  it("steps: reports Complete with no error once every stage is done", () => {
    const r = applyRedeem("steps", stepsConfig, {
      current_value: 6,
      completed_stage_keys: ["bronze", "silver"],
    });
    expect(r.rewardDescription).toBe("Complete");
    expect(r.delta).toEqual({});
  });
});
