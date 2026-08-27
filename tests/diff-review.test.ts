import { describe, expect, it } from "vitest";
import { inspectCandidateDiff } from "../lib/diff-review";

describe("Diff Review", () => {
  it("summarizes an inserted unified diff without applying it", () => {
    const review = inspectCandidateDiff("--- a/app/login.tsx\n+++ b/app/login.tsx\n@@ -1 +1 @@\n-old\n+new");
    expect(review.files).toEqual(["app/login.tsx"]);
    expect(review.additions).toBe(1);
    expect(review.deletions).toBe(1);
    expect(review.boundary).toContain("не применяет patch");
  });

  it("elevates risky secrets and dynamic execution", () => {
    const review = inspectCandidateDiff("--- a/server/a.ts\n+++ b/server/a.ts\n@@\n+const api_key = 'x';\n+eval(input)");
    expect(review.risk).toBe("high");
  });
});
