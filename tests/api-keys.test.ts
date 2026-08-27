import { describe, expect, it } from "vitest";

import { AI40_API_KEY_SCOPES, createApiKeyMaterial, extractApiKey, hashApiKey, isApiKeyFormat } from "../server/api-keys";

describe("AI40 API key material", () => {
  it("generates high-entropy server key material without exposing a hash as a credential", () => {
    const first = createApiKeyMaterial();
    const second = createApiKeyMaterial();

    expect(first.secret).not.toBe(second.secret);
    expect(isApiKeyFormat(first.secret)).toBe(true);
    expect(first.prefix.length).toBe("ai40_live_".length + 8);
    expect(hashApiKey(first.secret, "test-pepper")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("accepts only correctly formatted X-API-Key or Bearer key credentials", () => {
    const { secret } = createApiKeyMaterial();
    expect(extractApiKey({ "x-api-key": secret })).toBe(secret);
    expect(extractApiKey({ authorization: `Bearer ${secret}` })).toBe(secret);
    expect(extractApiKey({ authorization: "Bearer project-session-token" })).toBeNull();
    expect(extractApiKey({ "x-api-key": "bad" })).toBeNull();
  });

  it("publishes a narrow, explicit scope vocabulary", () => {
    expect(AI40_API_KEY_SCOPES).toEqual(["agent:run", "chat:complete", "models:read", "worker:plan"]);
  });
});
