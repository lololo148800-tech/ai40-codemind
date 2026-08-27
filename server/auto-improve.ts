import { selectChatProfile, type ChatProfile } from "./chat-profiles";

export const AUTO_IMPROVEMENT_AREAS = ["quality", "bugs", "performance", "security", "ux", "capability"] as const;
export type AutoImprovementArea = (typeof AUTO_IMPROVEMENT_AREAS)[number];
export type ImprovementRisk = "low" | "medium" | "high";

export type AutoImprovementPlan = {
  title: string;
  area: AutoImprovementArea;
  profile: ChatProfile;
  risk: ImprovementRisk;
  riskNotes: string[];
  acceptanceCriteria: string[];
  steps: Array<{ id: string; title: string; evidence: string; requiresApproval: boolean }>;
  execution: { state: "approval_required"; mayEditCode: false; mayMerge: false; mayPublish: false };
  boundary: string;
};

const HIGH_RISK = /(?:secret|token|api.?key|парол|ключ|credential|disable.{0,30}(?:security|auth)|отключ.{0,30}(?:защит|авторизац)|auto.?deploy|авто.?публик|auto.?merge|авто.?мерж)/i;
const MEDIUM_RISK = /(?:database|migration|schema|delete|удал|auth|oauth|payment|оплат|production|прод)/i;

function riskFor(requirement: string): { risk: ImprovementRisk; notes: string[] } {
  if (HIGH_RISK.test(requirement)) return { risk: "high", notes: ["Запрос затрагивает секреты, защиту или автоматическую публикацию.", "План будет ограничен анализом и ручным approval; секреты не принимаются в тексте задачи."] };
  if (MEDIUM_RISK.test(requirement)) return { risk: "medium", notes: ["Запрос может затронуть данные, авторизацию или production-поведение.", "Нужны миграционный план, rollback и CI evidence до ручного approval."] };
  return { risk: "low", notes: ["Изменение можно безопасно начать с изолированного плана, тестов и review."] };
}

/** Produces an auditable candidate plan. It never edits files, calls GitHub, merges branches, deploys or publishes. */
export function buildAutoImprovementPlan(input: { requirement: string; area: AutoImprovementArea }): AutoImprovementPlan {
  const requirement = input.requirement.trim();
  const profile = selectChatProfile(input.area === "ux" ? "create" : "code", requirement);
  const assessment = riskFor(requirement);
  return {
    title: `Улучшение AI40: ${requirement.slice(0, 96)}`,
    area: input.area,
    profile,
    risk: assessment.risk,
    riskNotes: assessment.notes,
    acceptanceCriteria: ["Определены наблюдаемые критерии готовности.", "Добавлены или обновлены релевантные regression-тесты.", "Typecheck, lint и test suite возвращают evidence.", "Любой diff, merge, deploy или внешнее действие проверяется и подтверждается owner-admin отдельно."],
    steps: [
      { id: "scope", title: "Разобрать запрос и текущие границы", evidence: "Краткий change plan без скрытых допущений.", requiresApproval: false },
      { id: "candidate", title: "Подготовить изолированный candidate diff", evidence: "Reviewable diff и список затронутых файлов.", requiresApproval: true },
      { id: "verify", title: "Запустить quality gate", evidence: "Typecheck, lint, tests и при необходимости GitHub CI run URL.", requiresApproval: true },
      { id: "apply", title: "Применить только после owner-admin review", evidence: "Отдельное явное решение: принять, изменить или отклонить candidate.", requiresApproval: true },
    ],
    execution: { state: "approval_required", mayEditCode: false, mayMerge: false, mayPublish: false },
    boundary: "AutoImprove Lab не имеет права самостоятельно менять исходники, запускать произвольные команды, обращаться к секретам, мержить ветки или публиковать релиз. Он создаёт только проверяемый план улучшения.",
  };
}
