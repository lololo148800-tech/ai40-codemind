import { describe, expect, it } from "vitest";

import { composeMaterialContext, type ContextMaterial } from "../lib/context-utils";

function material(overrides: Partial<ContextMaterial> & { id?: string }): ContextMaterial {
  return {
    name: "note.md",
    useAsContext: true,
    contentPreview: "Пример текста",
    ...overrides,
  };
}

describe("workspace context", () => {
  it("includes only explicitly selected readable materials", () => {
    const result = composeMaterialContext([
      material({ name: "selected.md", contentPreview: "Разрешённый текст" }),
      material({ id: "file-2", name: "hidden.pdf", useAsContext: true, contentPreview: undefined }),
      material({ id: "file-3", name: "off.md", useAsContext: false, contentPreview: "Не должен попасть" }),
    ]);

    expect(result).toContain("SOURCE: selected.md");
    expect(result).toContain("Разрешённый текст");
    expect(result).not.toContain("hidden.pdf");
    expect(result).not.toContain("Не должен попасть");
  });

  it("bounds context to three material previews", () => {
    const result = composeMaterialContext([
      material({ id: "1", name: "one.md" }),
      material({ id: "2", name: "two.md" }),
      material({ id: "3", name: "three.md" }),
      material({ id: "4", name: "four.md" }),
    ]);

    expect(result).toContain("one.md");
    expect(result).toContain("three.md");
    expect(result).not.toContain("four.md");
  });
});
