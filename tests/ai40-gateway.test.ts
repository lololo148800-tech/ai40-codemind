import { describe, expect, it } from "vitest";

import { AI40_GATEWAY_MODELS, gatewayCompletion, gatewayMessageContent, selectGatewayModel, workerPlanResponse } from "../server/ai40-gateway";

describe("AI40 OpenAI-compatible gateway", () => {
  const catalog = ["gpt-5", "gpt-5-mini", "gemini-3-flash-preview", "claude-opus-4-7"];

  it("exposes stable aliases and resolves them only to live catalog entries", () => {
    expect(AI40_GATEWAY_MODELS).toEqual(["ai40-code", "ai40-fast", "ai40-reason"]);
    expect(selectGatewayModel("ai40-code", catalog)).toBe("gpt-5");
    expect(selectGatewayModel("ai40-fast", catalog)).toBe("gemini-3-flash-preview");
    expect(selectGatewayModel("ai40-reason", catalog)).toBe("claude-opus-4-7");
  });

  it("accepts an explicitly available model and falls back safely for unknown aliases", () => {
    expect(selectGatewayModel("gpt-5-mini", catalog)).toBe("gpt-5-mini");
    expect(selectGatewayModel("not-a-live-model", catalog)).toBe("gpt-5");
    expect(selectGatewayModel("ai40-code", [])).toBeNull();
  });

  it("returns text only from upstream content", () => {
    expect(gatewayMessageContent("  answer  ")).toBe("answer");
    expect(gatewayMessageContent([{ type: "text", text: "answer" }])).toBe("");
  });

  it("formats one deterministic OpenAI-compatible completion for normal and SSE clients", () => {
    const completion = gatewayCompletion({ id: "chatcmpl_test", created: 1, model: "gpt-5", content: "answer", finishReason: "stop" });
    expect(completion.choices[0]).toEqual({ index: 0, message: { role: "assistant", content: "answer" }, finish_reason: "stop" });
  });

  it("keeps a worker request at an explicit approval-first plan boundary", () => {
    const response = workerPlanResponse("Проверь TypeScript проект и подготовь test plan");
    expect(response.object).toBe("ai40.worker.plan");
    expect(response.execution).toBe("approval_required");
    expect(response.runbook.steps.length).toBeGreaterThan(0);
  });
});
