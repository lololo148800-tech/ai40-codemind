import { parsePublicGithubUrl } from "./github-manifest";

export type CiRun = {
  id: number;
  name: string;
  event: string;
  status: "queued" | "in_progress" | "completed" | "unknown";
  conclusion: string | null;
  branch: string;
  headSha: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

type WorkflowRunsResponse = { workflow_runs?: Array<Record<string, unknown>> };

function normalizeRun(run: Record<string, unknown>): CiRun | null {
  if (typeof run.id !== "number" || typeof run.html_url !== "string") return null;
  const status = run.status === "queued" || run.status === "in_progress" || run.status === "completed" ? run.status : "unknown";
  return {
    id: run.id,
    name: typeof run.name === "string" ? run.name : "GitHub workflow",
    event: typeof run.event === "string" ? run.event : "unknown",
    status,
    conclusion: typeof run.conclusion === "string" ? run.conclusion : null,
    branch: typeof run.head_branch === "string" ? run.head_branch : "unknown",
    headSha: typeof run.head_sha === "string" ? run.head_sha.slice(0, 12) : "unknown",
    url: run.html_url,
    createdAt: typeof run.created_at === "string" ? run.created_at : "",
    updatedAt: typeof run.updated_at === "string" ? run.updated_at : "",
  };
}

/** Reads only public GitHub Actions metadata; no clone, workflow dispatch, or code execution. */
export async function fetchPublicCiRuns(repositoryUrl: string) {
  const { owner, repo, canonicalUrl } = parsePublicGithubUrl(repositoryUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=12`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "AI40-CodeMind/CI-dashboard" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 404 ? "Репозиторий или GitHub Actions не найдены. Для private repo потребуется отдельное OAuth-подключение." : `GitHub API вернул HTTP ${response.status}. Повторите запрос позднее.`);
    const payload = await response.json() as WorkflowRunsResponse;
    return {
      repositoryUrl: canonicalUrl,
      access: "public_metadata" as const,
      runs: (payload.workflow_runs ?? []).map(normalizeRun).filter((run): run is CiRun => Boolean(run)),
      evidenceBoundary: "Статусы получены из публичного GitHub Actions API. AI40 не запускает workflow из приложения и не считает run успешным без статуса completed/success.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildCiConnectionPlan(repositoryUrl: string) {
  const { canonicalUrl } = parsePublicGithubUrl(repositoryUrl);
  return {
    repositoryUrl: canonicalUrl,
    accessPath: "Официальный GitHub connector → owner-authorized repository access → GitHub Actions evidence" as const,
    steps: [
      "Включить официальный GitHub connector и пройти OAuth в защищённом GitHub flow — не вставлять PAT, пароль или OAuth code в AI40.",
      "Выбрать только нужный репозиторий и проверить, что .github/workflows/ai40-quality-gate.yml есть в ветке main.",
      "Открыть pull request или вручную запустить workflow на стороне GitHub Actions.",
      "Открыть CI Dashboard в AI40 и сверить run URL, commit SHA, status/conclusion и APK artifact, если он был создан.",
    ],
    approvalRequired: "Private repository, создание pull request, dispatch workflow, запись файлов, Android-сборка и merge требуют отдельных owner подтверждений в GitHub.",
    boundary: "AI40 не получает пароль GitHub, personal access token или OAuth code в мобильном клиенте. Публичные runs доступны read-only; private CI требует официальный connector и выбранные владельцем права.",
  };
}
