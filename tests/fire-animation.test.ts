import { describe, expect, it } from "vitest";

import { getCombustionFrame } from "../src/ui/fire-animation";

describe("fire animation helpers", () => {
  it("changes fire-source phases across ticks", () => {
    const frameA = getCombustionFrame("fireSource", "burning", 0, { x: 2, y: 3 });
    const frameB = getCombustionFrame("fireSource", "burning", 1, { x: 2, y: 3 });

    expect(frameA.mode).toBe("source");
    expect(frameB.mode).toBe("source");
    expect(frameA.phase).not.toBe(frameB.phase);
  });

  it("changes burning-cell phases across ticks", () => {
    const frameA = getCombustionFrame("hay", "burning", 0, { x: 4, y: 5 });
    const frameB = getCombustionFrame("hay", "burning", 1, { x: 4, y: 5 });

    expect(frameA.mode).toBe("burning");
    expect(frameB.mode).toBe("burning");
    expect(frameA.phase).not.toBe(frameB.phase);
  });

  it("keeps non-burning cells visually static", () => {
    expect(getCombustionFrame("hay", "idle", 0, { x: 1, y: 1 })).toEqual(
      getCombustionFrame("hay", "idle", 12, { x: 1, y: 1 })
    );
  });
});
