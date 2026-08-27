import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import { buildCiConnectionPlan, fetchPublicCiRuns } from "../server/ci-dashboard";
import { assertSafePublicHttpsUrl, inspectPublicWebsite } from "../server/website-analysis";

describe("AI40 CI dashboard", () => {
  it("configures pnpm before setup-node asks for a pnpm cache", () => {
    ["ai40-quality-gate.yml", "ai40-android-debug-artifact.yml"].forEach((file) => {
      const source = readFileSync(`.github/workflows/${file}`, "utf8");
      expect(source.indexOf("- name: Setup pnpm")).toBeLessThan(source.indexOf("- name: Setup Node"));
    });
  });

  it("creates an approval-first GitHub connection plan", () => {
    const plan = buildCiConnectionPlan("https://github.com/owner/repo");
    expect(plan.repositoryUrl).toBe("https://github.com/owner/repo");
    expect(plan.approvalRequired).toContain("подтверждения");
  });

  it("normalizes public GitHub workflow evidence without dispatching a run", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ workflow_runs: [{ id: 9, name: "Quality", event: "pull_request", status: "completed", conclusion: "success", head_branch: "main", head_sha: "abcdef1234567890", html_url: "https://github.com/owner/repo/actions/runs/9", created_at: "2026-08-27T00:00:00Z", updated_at: "2026-08-27T00:02:00Z" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const report = await fetchPublicCiRuns("https://github.com/owner/repo");
    expect(report.runs[0]).toMatchObject({ status: "completed", conclusion: "success", headSha: "abcdef123456" });
    expect(fetchMock.mock.calls[0][0]).toContain("/actions/runs");
    vi.unstubAllGlobals();
  });
});

describe("AI40 public website analysis", () => {
  it("rejects local, insecure and credential-bearing targets", () => {
    expect(() => assertSafePublicHttpsUrl("http://example.com")).toThrow("публичные HTTPS");
    expect(() => assertSafePublicHttpsUrl("https://127.0.0.1/admin")).toThrow("публичные HTTPS");
    expect(() => assertSafePublicHttpsUrl("https://user:pass@example.com")).toThrow("публичные HTTPS");
  });

  it("extracts only a bounded public HTML brief", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('<html lang="ru"><head><title>AI40</title><meta name="description" content="Проверяемый агент"></head><body><h1>Качество</h1></body></html>', { status: 200, headers: { "content-type": "text/html" } })));
    const brief = await inspectPublicWebsite("https://example.com");
    expect(brief).toMatchObject({ title: "AI40", description: "Проверяемый агент", language: "ru", headings: ["Качество"], access: "public_read_only" });
    vi.unstubAllGlobals();
  });
});
