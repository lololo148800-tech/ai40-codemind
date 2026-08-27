import { describe, expect, it } from "vitest";
import { CANDIDATE_DECISION_LABEL, CANDIDATE_STATUS_LABEL, createCandidateCiEvidence, isCandidateReadyForCiEvidence, type AutoImproveCandidate } from "../lib/auto-improve-queue";

describe("AutoImprove candidate queue contract", () => {
  it("uses an explicit, non-merge status lifecycle", () => {
    const candidate: Pick<AutoImproveCandidate, "status" | "risk" | "decision"> = { status: "draft", risk: "medium", decision: "pending" };
    expect(CANDIDATE_STATUS_LABEL[candidate.status]).toBe("Candidate draft");
    expect(Object.keys(CANDIDATE_STATUS_LABEL)).toEqual(["draft", "reviewed", "ci_ready"]);
    expect(CANDIDATE_DECISION_LABEL.approved_for_ci).toBe("Одобрено для CI");
  });

  it("accepts only a verifiable GitHub Actions run as CI evidence", () => {
    const evidence = createCandidateCiEvidence({ runUrl: "https://github.com/owner/repo/actions/runs/123", commitSha: "abcdef123456", conclusion: "success", artifactName: "ai40-debug.apk" });
    expect(evidence.runUrl).toContain("/actions/runs/123");
    expect(evidence.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(() => createCandidateCiEvidence({ runUrl: "https://example.com/run/1", commitSha: "abcdef1", conclusion: "success" })).toThrow("Evidence");
  });

  it("requires both lifecycle readiness and owner approval before evidence can be attached", () => {
    const candidate = { id: "id", title: "title", requirement: "requirement", area: "quality", risk: "low", profileLabel: "Engineer", status: "ci_ready", decision: "approved_for_ci", createdAt: "2026-08-01T00:00:00Z" } satisfies AutoImproveCandidate;
    expect(isCandidateReadyForCiEvidence(candidate)).toBe(true);
    expect(isCandidateReadyForCiEvidence({ ...candidate, decision: "pending" })).toBe(false);
  });
});
