import { describe, expect, it } from "vitest";

import { buildQualityGate, buildRoleAssignments, IMPORTED_ARCHIVES, IMPORTED_PROFILE_REFERENCE, PANEL_ROLE_DEFINITIONS, runMultiAgentPanel, type PanelRoleResult } from "../server/multi-agent";

describe("multi-agent panel planning", () => {
  it("keeps the imported reference descriptive and bounds the active panel to ten roles", () => {
    expect(IMPORTED_PROFILE_REFERENCE.importedProfiles).toBe(26);
    expect(IMPORTED_PROFILE_REFERENCE.activeRoles).toBe(10);
    expect(PANEL_ROLE_DEFINITIONS).toHaveLength(10);
  });

  it("keeps ZIP imports as non-executable references with stable hashes", () => {
    expect(IMPORTED_ARCHIVES).toHaveLength(3);
    expect(IMPORTED_ARCHIVES.every((archive) => archive.status === "chat_attachment_reference")).toBe(true);
    expect(IMPORTED_ARCHIVES.every((archive) => /^[a-f0-9]{64}$/.test(archive.sha256))).toBe(true);
  });

  it("marks a code review as ready only with successful primary roles and context", () => {
    const roles = PANEL_ROLE_DEFINITIONS.map((role): PanelRoleResult => ({
      ...role,
      model: role.preferredModel,
      priority: ["implementer", "reviewer", "security", "critic"].includes(role.id) ? "primary" : "supporting",
      status: "completed",
      content: "verified note",
      evidence: ["role output"],
    }));
    const gate = buildQualityGate({ intent: "code_review", context: "const value = 1;", roles });

    expect(gate.status).toBe("ready_to_plan");
    expect(gate.confidence).toBe("high");
    expect(gate.completedRoles).toBe(10);
  });

  it("downgrades the gate when a primary code-review role fails", () => {
    const roles: PanelRoleResult[] = [{
      ...PANEL_ROLE_DEFINITIONS[0],
      model: PANEL_ROLE_DEFINITIONS[0].preferredModel,
      priority: "supporting",
      status: "completed",
      content: "note",
      evidence: ["role output"],
    }, {
      ...PANEL_ROLE_DEFINITIONS[1],
      model: PANEL_ROLE_DEFINITIONS[1].preferredModel,
      priority: "primary",
      status: "failed",
      content: "temporary failure",
      evidence: ["role output"],
    }];
    const gate = buildQualityGate({ intent: "code_review", context: "snippet", roles });

    expect(gate.status).toBe("degraded");
    expect(gate.missingPrimaryRoles).toContain("Инженер реализации");
  });

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
