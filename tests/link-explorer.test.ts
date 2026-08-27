import { describe, expect, it } from "vitest";

import { assertSafePublicLinkUrl, classifyLinkSource, extractSafeOutgoingLinks, linkAccessFor, MAX_LINK_DEPTH } from "../server/link-explorer";

describe("Link Explorer URL boundary", () => {
  it("accepts canonical public HTTPS and strips fragment", () => {
    expect(assertSafePublicLinkUrl("https://github.com/openai/openai#readme").toString()).toBe("https://github.com/openai/openai");
  });

  it("rejects non-public targets, credentials and non-HTTPS schemes", () => {
    ["http://example.com", "https://localhost/private", "https://127.0.0.1", "https://user:pass@example.com", "https://10.0.0.4", "https://[::1]"]
      .forEach((url) => expect(() => assertSafePublicLinkUrl(url)).toThrow());
  });
});

describe("Link Explorer source policy", () => {
  it("labels GitHub public-read-only and Google/Manus as browser-required", () => {
    expect(classifyLinkSource(new URL("https://github.com/owner/repo"))).toBe("github");
    expect(linkAccessFor(new URL("https://github.com/owner/repo")).access).toBe("public_read_only");
    expect(linkAccessFor(new URL("https://www.google.com/search?q=ai40")).access).toBe("requires_browser");
    expect(linkAccessFor(new URL("https://manus.im/task/abc")).access).toBe("requires_browser");
  });

  it("extracts only unique safe public HTTPS anchors up to a fixed limit", () => {
    const links = extractSafeOutgoingLinks('<a href="/docs">docs</a><a href="https://example.com/docs">same</a><a href="http://nope.example">no</a><a href="/next#top">next</a>', new URL("https://example.com/start"));
    expect(links).toEqual(["https://example.com/docs", "https://example.com/next"]);
    expect(MAX_LINK_DEPTH).toBe(3);
  });
});
