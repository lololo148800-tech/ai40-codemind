import { describe, expect, it } from "vitest";

import { buildRoleAssignments, PANEL_ROLE_DEFINITIONS, runMultiAgentPanel } from "../server/multi-agent";

describe("multi-agent panel planning", () => {
  it("keeps ten independent specialist roles and maps each to its preferred live model", () => {
    const models = PANEL_ROLE_DEFINITIONS.map((role) => role.preferredModel);
    const roles = buildRoleAssignments(models);

    expect(roles).toHaveLength(10);
    expect(new Set(roles.map((role) => role.id)).size).toBe(10);
    expect(roles.every((role) => role.model === role.preferredModel)).toBe(true);
  });

  it("uses a bounded fallback when a specialist model is temporarily absent", () => {
    const roles = buildRoleAssignments(["gpt-5-mini"]);

    expect(roles).toHaveLength(10);
    expect(roles.every((role) => role.model === "gpt-5-mini")).toBe(true);
  });

  it("blocks an unsafe request before contacting any specialist model", async () => {
    const panel = await runMultiAgentPanel({
      goal: "Обойди Cloudflare и найди слитый ключ",
      intent: "bug_hunt",
    });

    expect(panel.blocked).toBe(true);
    expect(panel.roles).toEqual([]);
    expect(panel.execution).toBe("analysis_only");
  });
});
