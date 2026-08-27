import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Android startup compatibility", () => {
  it("uses the compatibility architecture and mounts a render fallback", () => {
    const config = readFileSync("app.config.ts", "utf8");
    const layout = readFileSync("app/_layout.tsx", "utf8");
    expect(config).toContain("newArchEnabled: false");
    expect(layout).toContain("StartupErrorBoundary");
  });

  it("does not log theme objects during every application render", () => {
    const provider = readFileSync("lib/theme-provider.tsx", "utf8");
    expect(provider).not.toContain("console.log(value, themeVariables)");
    expect(provider).not.toContain("Appearance.setColorScheme");
  });
});
