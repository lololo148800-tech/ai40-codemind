export type DiffRisk = "low" | "medium" | "high";

export type DiffReview = {
  files: string[];
  additions: number;
  deletions: number;
  hunks: number;
  risk: DiffRisk;
  flags: string[];
  testChecklist: string[];
  boundary: string;
};

const HIGH_RISK = /(?:api[_-]?key|secret|token|password|private[_-]?key|eval\(|exec\(|child_process|rm\s+-rf|DROP\s+TABLE|disable.{0,30}(?:auth|security)|bypass)/i;
const MEDIUM_RISK = /(?:migration|schema|delete|oauth|auth|payment|production|publish|deploy)/i;

/** Reviews a user-provided unified diff as text. It never touches the real filesystem or applies a patch. */
export function inspectCandidateDiff(diff: string): DiffReview {
  const source = diff.slice(0, 40_000);
  const files = Array.from(new Set(Array.from(source.matchAll(/^\+\+\+\s+(?:b\/)?(.+)$/gm), (match) => match[1].trim()).filter((path) => path !== "/dev/null"))).slice(0, 30);
  const additions = (source.match(/^\+(?!\+\+)/gm) ?? []).length;
  const deletions = (source.match(/^-(?!--)/gm) ?? []).length;
  const hunks = (source.match(/^@@/gm) ?? []).length;
  const flags: string[] = [];
  let risk: DiffRisk = "low";
  if (HIGH_RISK.test(source)) { risk = "high"; flags.push("В diff найдены секреты, dynamic execution, destructive SQL/shell или попытка отключить защиту."); }
  else if (MEDIUM_RISK.test(source)) { risk = "medium"; flags.push("Diff затрагивает авторизацию, данные, production или deployment и требует дополнительного review."); }
  if (!files.length) flags.push("Не найден unified diff. Вставьте строки `--- a/file` и `+++ b/file` для review файлов.");
  if (!hunks && files.length) flags.push("В diff нет hunk-блоков `@@`; проверьте полноту candidate diff.");
  if (!flags.length) flags.push("Явные высокорисковые конструкции в тексте diff не найдены; это не заменяет code review.");
  return {
    files,
    additions,
    deletions,
    hunks,
    risk,
    flags,
    testChecklist: ["Запустить typecheck и lint.", "Добавить или обновить regression-тесты для затронутого поведения.", "Запустить test suite в CI и сохранить run URL/evidence.", "Проверить rollback-путь до owner-admin решения."],
    boundary: "Diff Review читает только вставленный текст. Он не применяет patch, не открывает файлы, не запускает команды и не мержит ветки.",
  };
}
