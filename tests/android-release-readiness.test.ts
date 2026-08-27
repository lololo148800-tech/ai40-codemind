import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Android release readiness workflow", () => {
  it("checks the four protected signing values without building or exposing a release", () => {
    const source = readFileSync(".github/workflows/ai40-android-release-readiness.yml", "utf8");
    ["ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"].forEach((name) => expect(source).toContain(name));
    expect(source).toContain("workflow_dispatch");
    expect(source).not.toMatch(/assembleRelease|base64 --decode|upload-artifact/);
  });
});
