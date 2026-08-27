import { describe, expect, it } from "vitest";

import { isPermittedTextPath, parsePublicGithubUrl } from "../server/github-manifest";

describe("user-provided GitHub manifest guard", () => {
  it("accepts only canonical public GitHub repository URLs", () => {
    expect(parsePublicGithubUrl("https://github.com/example/project")).toEqual({ owner: "example", repo: "project", canonicalUrl: "https://github.com/example/project" });
    expect(() => parsePublicGithubUrl("https://evil.example/repository")).toThrow("публичная ссылка");
  });

  it("rejects environment and path traversal files", () => {
    expect(isPermittedTextPath("src/index.ts")).toBe(true);
    expect(isPermittedTextPath(".env")).toBe(false);
    expect(isPermittedTextPath("src/../secret.txt")).toBe(false);
    expect(isPermittedTextPath("media/video.mp4")).toBe(false);
  });
});
