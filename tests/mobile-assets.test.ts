import { lstatSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const REQUIRED_ASSETS = [
  "assets/images/icon.png",
  "assets/images/splash-icon.png",
  "assets/images/favicon.png",
  "assets/images/android-icon-foreground.png",
];

describe("AI40 mobile build assets", () => {
  it("keeps every Expo icon asset as a real PNG rather than a sandbox-only symlink", () => {
    REQUIRED_ASSETS.forEach((path) => {
      expect(lstatSync(path).isSymbolicLink(), `${path} must be a regular file`).toBe(false);
      expect(readFileSync(path).subarray(0, 8).toString("hex"), `${path} must be a PNG`).toBe("89504e470d0a1a0a");
    });
  });
});
