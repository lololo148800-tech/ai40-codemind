import { describe, expect, it } from "vitest";

import { EXECUTION_STATUS, getExecutionStatus } from "../lib/execution-status";

describe("AI40 execution status", () => {
  it("does not label production release as confirmed before signing setup", () => {
    expect(getExecutionStatus("production")).toMatchObject({ tone: "neutral", label: "Нужна настройка" });
  });

  it("binds the verified CI status to a concrete immutable evidence URL", () => {
    const ci = getExecutionStatus("github-ci");
    expect(ci?.evidenceUrl).toContain("actions/runs/33077367454");
    expect(ci?.label).toBe("Подтверждено");
  });

  it("keeps every execution state unique and actionable", () => {
    expect(new Set(EXECUTION_STATUS.map((entry) => entry.id)).size).toBe(EXECUTION_STATUS.length);
    expect(EXECUTION_STATUS.every((entry) => Boolean(entry.route))).toBe(true);
  });
});
