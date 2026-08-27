/**
 * Source: ai40_codemind_v7_full_source.zip → repositoryImport.ts
 * Adapted to serve a manifest-only public GitHub workflow. No clone, install,
 * execution, secret-file read, or private-repository access is permitted.
 */
export type RepositoryFile = { path: string; type: "blob" | "tree"; size?: number };

export type RepositoryManifest = {
  provider: "GitHub";
  repositoryUrl: string;
  fullName: string;
  defaultBranch: string;
  totalEntries: number;
  truncated: boolean;
  files: RepositoryFile[];
};

const MAX_MANIFEST_ENTRIES = 500;
const TEXT_EXTENSIONS = new Set(["ts", "tsx", "js", "jsx", "json", "md", "mdx", "css", "scss", "html", "yml", "yaml", "toml", "py", "go", "rs", "java", "kt", "swift", "sql", "sh", "txt"]);
const FETCH_OPTIONS = { headers: { Accept: "application/vnd.github+json", "User-Agent": "AI40-Assistant/1.0 manifest-only" } };

export function parsePublicGithubUrl(repositoryUrl: string) {
  const normalized = repositoryUrl.trim();
  const match = normalized.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/);
  if (!match) throw new Error("Поддерживается только публичная ссылка вида https://github.com/owner/repository.");
  return { owner: match[1], repo: match[2], canonicalUrl: `https://github.com/${match[1]}/${match[2]}` };
}

export function isPermittedTextPath(path: string) {
  if (!path || path.length > 260 || path.includes("..") || path.startsWith("/") || path.split("/").some((part) => part === ".env" || part.startsWith(".env."))) return false;
  const extension = path.split(".").pop()?.toLowerCase();
  return Boolean(extension && TEXT_EXTENSIONS.has(extension));
}

async function getJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { ...FETCH_OPTIONS, signal: controller.signal });
    if (!response.ok) {
      throw new Error(response.status === 404
        ? "Репозиторий не найден или не является публичным."
        : `GitHub API вернул HTTP ${response.status}. Повторите запрос с учётом лимитов GitHub.`);
    }
    return response.json() as Promise<unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetches only metadata and a bounded file tree. It never clones or executes repository content. */
export async function importPublicGithubManifest(repositoryUrl: string): Promise<RepositoryManifest> {
  const { owner, repo, canonicalUrl } = parsePublicGithubUrl(repositoryUrl);
  const repository = await getJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`) as { full_name?: string; default_branch?: string };
  const defaultBranch = repository.default_branch;
  if (!defaultBranch || !repository.full_name) throw new Error("GitHub не вернул метаданные публичного репозитория.");
  const tree = await getJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`) as { truncated?: boolean; tree?: { path?: string; type?: string; size?: number }[] };
  const entries = (tree.tree ?? []).filter((entry): entry is { path: string; type: "blob" | "tree"; size?: number } => Boolean(entry.path) && (entry.type === "blob" || entry.type === "tree"));
  return {
    provider: "GitHub",
    repositoryUrl: canonicalUrl,
    fullName: repository.full_name,
    defaultBranch,
    totalEntries: entries.length,
    truncated: Boolean(tree.truncated) || entries.length > MAX_MANIFEST_ENTRIES,
    files: entries.slice(0, MAX_MANIFEST_ENTRIES).map(({ path, type, size }) => ({ path, type, ...(typeof size === "number" ? { size } : {}) })),
  };
}
