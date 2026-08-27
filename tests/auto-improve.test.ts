import { describe, expect, it } from "vitest";
import { buildAutoImprovementPlan } from "../server/auto-improve";
import { selectChatProfile } from "../server/chat-profiles";

describe("adaptive AI40 chat profiles", () => {
  it("selects bounded profiles by task, not by elevated permissions", () => {
    expect(selectChatProfile("code", "Проверь баг и test log").id).toBe("review");
    expect(selectChatProfile("research", "Сравни источники").id).toBe("research");
    expect(selectChatProfile("question", "Сделай HTML API").id).toBe("engineering");
  });
});

describe("owner-admin AutoImprove candidate plans", () => {
  it("produces an approval-only improvement workflow", () => {
    const plan = buildAutoImprovementPlan({ area: "bugs", requirement: "Улучшить обработку ошибок формы и добавить regression-тесты" });
    expect(plan.execution).toEqual({ state: "approval_required", mayEditCode: false, mayMerge: false, mayPublish: false });
    expect(plan.steps.some((step) => step.title.includes("quality gate"))).toBe(true);
  });

  it("raises risk around secret or deployment language instead of enabling it", () => {
    const plan = buildAutoImprovementPlan({ area: "security", requirement: "Отключить защиту и автоматически задеплоить с API key" });
    expect(plan.risk).toBe("high");
    expect(plan.boundary).toContain("не имеет права самостоятельно менять");
  });
});
