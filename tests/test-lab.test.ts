import { describe, expect, it } from "vitest";

import { analyzeTestLog, buildTestPlan } from "../server/test-lab";

describe("AI40 Test Lab", () => {
  it("prepares commands as an approval-only runbook instead of executing them", () => {
    const plan = buildTestPlan({ target: "expo_node", goal: "Проверить PR" });
    expect(plan.approvalRequired).toBe(true);
    expect(plan.commands.map((command) => command.command)).toEqual(["pnpm check", "pnpm lint", "pnpm test"]);
    expect(plan.workerBoundary).toContain("не запускает");
  });

  it("reads successful test evidence from pasted output", () => {
    const result = analyzeTestLog("Tests 40 passed | 1 skipped (41)\nFound 0 errors.");
    expect(result.status).toBe("passed_evidence_seen");
    expect(result.totals).toEqual({ passed: 40, failed: 0, skipped: 1 });
  });

  it("does not call an error log a successful run", () => {
    const result = analyzeTestLog("FAIL tests/widget.test.ts\nError: expected true to be false");
    expect(result.status).toBe("needs_attention");
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
