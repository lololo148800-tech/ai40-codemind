import { describe, expect, it } from "vitest";
import { AI_STUDIO_SECTIONS, findStudioFlow } from "../lib/ai-studio-catalog";
import { buildConnectorAccessPlan, listConnectorStatuses } from "../server/connector-plans";

describe("AI Studio catalogue", () => {
  it("routes each flow to a concrete AI40 workflow and keeps ids unique", () => {
    const flows = AI_STUDIO_SECTIONS.flatMap((section) => section.flows);
    expect(new Set(flows.map((flow) => flow.id)).size).toBe(flows.length);
    expect(flows.every((flow) => flow.route && flow.output && flow.label)).toBe(true);
    expect(findStudioFlow("code")?.readiness).toBe("ready");
    expect(findStudioFlow("video")?.readiness).toBe("brief");
  });
});

describe("Connector access plans", () => {
  it("does not falsely mark unconnected providers as available", () => {
    const statuses = listConnectorStatuses();
    expect(statuses.some((item) => item.status === "setup_required")).toBe(true);
    expect(buildConnectorAccessPlan("github", "CI evidence").approval).toContain("подтверждения");
    expect(buildConnectorAccessPlan("google", "Search evidence").status).toBe("browser_required");
  });
});
