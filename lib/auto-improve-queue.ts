import AsyncStorage from "@react-native-async-storage/async-storage";

export type CandidateStatus = "draft" | "reviewed" | "ci_ready";
export type CandidateDecision = "pending" | "approved_for_ci" | "changes_requested" | "rejected";
export type CiConclusion = "success" | "failure" | "cancelled" | "skipped" | "timed_out" | "action_required";

export type CandidateCiEvidence = {
  runUrl: string;
  commitSha: string;
  conclusion: CiConclusion;
  artifactName?: string;
  recordedAt: string;
};

export type AutoImproveCandidate = {
  id: string;
  title: string;
  requirement: string;
  area: string;
  risk: "low" | "medium" | "high";
  profileLabel: string;
  status: CandidateStatus;
  decision: CandidateDecision;
  ciEvidence?: CandidateCiEvidence;
  createdAt: string;
};

export type CandidateCiEvidenceInput = Omit<CandidateCiEvidence, "recordedAt">;

const KEY = "ai40.auto-improve.candidates.v1";
const MAX_CANDIDATES = 12;
const CONCLUSIONS: CiConclusion[] = ["success", "failure", "cancelled", "skipped", "timed_out", "action_required"];

function candidateId() {
  return `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDecision(value: unknown): value is CandidateDecision {
  return value === "pending" || value === "approved_for_ci" || value === "changes_requested" || value === "rejected";
}

function normalize(value: unknown): AutoImproveCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || !("id" in item) || !("title" in item) || !("status" in item)) return [];
    const candidate = item as AutoImproveCandidate;
    return [{ ...candidate, decision: isDecision(candidate.decision) ? candidate.decision : "pending" }];
  });
}

export function createCandidateCiEvidence(input: CandidateCiEvidenceInput): CandidateCiEvidence {
  const runUrl = input.runUrl.trim();
  let parsed: URL;
  try { parsed = new URL(runUrl); } catch { throw new Error("Укажите полный URL GitHub Actions run."); }
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || !/^\/[^/]+\/[^/]+\/actions\/runs\/\d+\/?$/.test(parsed.pathname)) {
    throw new Error("Evidence должен быть URL формата https://github.com/owner/repository/actions/runs/123.");
  }
  const commitSha = input.commitSha.trim();
  if (!/^[a-f0-9]{7,64}$/i.test(commitSha)) throw new Error("Укажите commit SHA из 7–64 hex-символов.");
  if (!CONCLUSIONS.includes(input.conclusion)) throw new Error("Укажите фактический conclusion GitHub Actions.");
  const artifactName = input.artifactName?.trim().slice(0, 160);
  return { runUrl: parsed.toString(), commitSha, conclusion: input.conclusion, ...(artifactName ? { artifactName } : {}), recordedAt: new Date().toISOString() };
}

export function isCandidateReadyForCiEvidence(candidate: AutoImproveCandidate) {
  return candidate.status === "ci_ready" && candidate.decision === "approved_for_ci";
}

export async function listAutoImproveCandidates() {
  try { return normalize(JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]")); } catch { return []; }
}

async function save(candidates: AutoImproveCandidate[]) {
  const bounded = candidates.slice(0, MAX_CANDIDATES);
  await AsyncStorage.setItem(KEY, JSON.stringify(bounded));
  return bounded;
}

export async function enqueueAutoImproveCandidate(input: Omit<AutoImproveCandidate, "id" | "createdAt" | "status" | "decision" | "ciEvidence">) {
  const item: AutoImproveCandidate = { ...input, id: candidateId(), status: "draft", decision: "pending", createdAt: new Date().toISOString() };
  const saved = await save([item, ...(await listAutoImproveCandidates())]);
  return { item, saved };
}

export async function setAutoImproveCandidateStatus(id: string, status: CandidateStatus) {
  return save((await listAutoImproveCandidates()).map((candidate) => candidate.id === id ? { ...candidate, status } : candidate));
}

export async function setAutoImproveCandidateDecision(id: string, decision: CandidateDecision) {
  return save((await listAutoImproveCandidates()).map((candidate) => candidate.id === id ? { ...candidate, decision } : candidate));
}

export async function setAutoImproveCandidateCiEvidence(id: string, input: CandidateCiEvidenceInput) {
  const evidence = createCandidateCiEvidence(input);
  return save((await listAutoImproveCandidates()).map((candidate) => candidate.id === id ? { ...candidate, ciEvidence: evidence } : candidate));
}

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  draft: "Candidate draft",
  reviewed: "Owner reviewed",
  ci_ready: "Готово к CI",
};

export const CANDIDATE_DECISION_LABEL: Record<CandidateDecision, string> = {
  pending: "Нужно решение",
  approved_for_ci: "Одобрено для CI",
  changes_requested: "Нужны правки",
  rejected: "Отклонено",
};

export const CI_CONCLUSION_LABEL: Record<CiConclusion, string> = {
  success: "CI success",
  failure: "CI failure",
  cancelled: "CI cancelled",
  skipped: "CI skipped",
  timed_out: "CI timed out",
  action_required: "Требуется действие",
};
