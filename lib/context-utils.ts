export type ContextMaterial = {
  name: string;
  useAsContext: boolean;
  contentPreview?: string;
};

export function composeMaterialContext(materials: ContextMaterial[]) {
  return materials
    .filter((material) => material.useAsContext && material.contentPreview)
    .slice(0, 3)
    .map((material) => `SOURCE: ${material.name}\n${material.contentPreview?.slice(0, 4_000) ?? ""}`)
    .join("\n\n");
}
