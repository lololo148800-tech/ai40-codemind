import { describe, expect, it } from "vitest";

import { CAPABILITY_SECTIONS, getCapabilityById, QUICK_CAPABILITY_IDS } from "../lib/capability-catalog";

describe("AI40 capability catalog", () => {
  it("lists distinct capabilities with an honest state and a usable route or setup next step", () => {
    const items = CAPABILITY_SECTIONS.flatMap((section) => section.items);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items.length).toBeGreaterThanOrEqual(16);
    expect(items.every((item) => Boolean(item.route || item.nextStep))).toBe(true);
    expect(items.some((item) => item.state === "setup")).toBe(true);
  });

  it("keeps every quick action attached to a real capability with a route", () => {
    QUICK_CAPABILITY_IDS.forEach((id) => expect(getCapabilityById(id)?.route).toBeTruthy());
  });
});
