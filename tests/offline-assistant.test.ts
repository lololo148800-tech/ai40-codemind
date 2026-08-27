import { describe, expect, it } from "vitest";

import { buildOfflineResponse } from "../lib/offline-assistant";
import { buildHealthSnapshot } from "../server/health";

describe("AI40 offline-first assistant", () => {
  it("never claims a server call when manual offline mode is selected", () => {
    const response = buildOfflineResponse({ message: "console.log('hello')", mode: "code", selectedMaterialCount: 1, cause: "manual" });
    expect(response).toContain("не отправлял запрос на сервер");
    expect(response).toContain("debug-вывод");
  });

  it("returns a local recovery fallback when network access fails", () => {
    const response = buildOfflineResponse({ message: "Проверь задачу", mode: "research", selectedMaterialCount: 0, cause: "network" });
    expect(response).toContain("Связь с сервером недоступна");
    expect(response).toContain("Офлайн Research Plan");
  });
});

describe("AI40 health snapshot", () => {
  it("is a minimal health-only response without configuration or secrets", () => {
    const health = buildHealthSnapshot(new Date("2026-08-27T00:00:00.000Z"), 9.8);
    expect(health).toEqual({ ok: true, service: "AI40 CodeMind", timestamp: "2026-08-27T00:00:00.000Z", uptimeSeconds: 9, mode: "managed", boundaries: ["health-only", "no-secrets", "no-user-data"] });
  });
});
