import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { normalizeOpenAIBaseUrl, resolveAI40InferenceRuntime } from "../server/_core/llm";
import { getTelegramIntegrationStatus, verifyTelegramInitData, verifyTelegramWebhookSecret } from "../server/telegram-ready";

describe("AI40 self-hosted inference adapter", () => {
  it("normalizes a compatible endpoint to its v1 base", () => {
    expect(normalizeOpenAIBaseUrl("https://models.example.com/api", true)).toBe("https://models.example.com/api/v1");
    expect(normalizeOpenAIBaseUrl("http://127.0.0.1:11434/v1/", false)).toBe("http://127.0.0.1:11434/v1");
  });

  it("keeps the provider credential server-side and uses self-hosted endpoint only when configured", () => {
    const selfHosted = resolveAI40InferenceRuntime({ selfHostedBaseUrl: "https://models.example.com", selfHostedApiKey: "server-secret", forgeApiUrl: "https://forge.example.com", forgeApiKey: "forge-secret", isProduction: true });
    expect(selfHosted).toMatchObject({ mode: "self_hosted", chatUrl: "https://models.example.com/v1/chat/completions", modelsUrl: "https://models.example.com/v1/models" });
    const managed = resolveAI40InferenceRuntime({ selfHostedBaseUrl: "", selfHostedApiKey: "", forgeApiUrl: "https://forge.example.com", forgeApiKey: "forge-secret", isProduction: true });
    expect(managed).toMatchObject({ mode: "managed", chatUrl: "https://forge.example.com/v1/chat/completions" });
  });
});

describe("Telegram-ready security boundary", () => {
  it("does not expose a ready webhook without all server-side fields", () => {
    expect(getTelegramIntegrationStatus({ botToken: "", webhookSecret: "", publicUrl: "" })).toMatchObject({ enabled: false, miniAppUrl: null, delivery: "not_configured" });
    expect(getTelegramIntegrationStatus({ botToken: "bot", webhookSecret: "secret", publicUrl: "https://ai40.example" })).toMatchObject({ enabled: true, miniAppAuthReady: true, delivery: "receive_only" });
  });

  it("uses constant-time comparison for webhook secret checks", () => {
    expect(verifyTelegramWebhookSecret("secret", "secret")).toBe(true);
    expect(verifyTelegramWebhookSecret("nope", "secret")).toBe(false);
  });

  it("verifies valid Mini App initData and rejects an altered hash", () => {
    const token = "123456:telegram-token";
    const data = new URLSearchParams({ auth_date: "1000", query_id: "AAE", user: '{"id":1}' });
    const dataCheck = [...data.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join("\n");
    const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
    const hash = createHmac("sha256", secretKey).update(dataCheck).digest("hex");
    data.set("hash", hash);
    expect(verifyTelegramInitData(data.toString(), token, 1_050)).toMatchObject({ valid: true });
    data.set("hash", "0".repeat(64));
    expect(verifyTelegramInitData(data.toString(), token, 1_050)).toMatchObject({ valid: false, reason: "invalid_signature" });
  });
});
