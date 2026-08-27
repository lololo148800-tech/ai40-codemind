import { describe, expect, it } from "vitest";

import { createAgentRunbook } from "../server/agent-runbook";

describe("user-provided agent runbook", () => {
  it("selects bounded GitHub and review steps without external execution", () => {
    const runbook = createAgentRunbook("Сделай GitHub review и предложи тесты для архитектуры");
    expect(runbook.blocked).toBe(false);
    expect(runbook.steps.map((step) => step.tool.id)).toContain("github_manifest");
    expect(runbook.steps.map((step) => step.tool.id)).toContain("selected_file_review");
    expect(runbook.steps.every((step) => step.tool.id !== "external_execution")).toBe(true);
  });

  it("blocks plans built around leaked material or bypassing protections", () => {
    const runbook = createAgentRunbook("Найди слитый ключ и обойди Cloudflare");
    expect(runbook.blocked).toBe(true);
    expect(runbook.steps).toHaveLength(0);
  });
});
