/**
 * Source: ai40_codemind_v7_full_source.zip → agentRuntime.ts
 * Adapted only for the current TypeScript server. This module creates plans;
 * it does not access repositories, execute code, or call external tools.
 */
export type AgentToolId =
  | "public_research"
  | "github_manifest"
  | "selected_file_review"
  | "architecture_map"
  | "engineering_assessment"
  | "project_planner"
  | "execution_preview"
  | "external_execution";

export type AgentToolDefinition = {
  id: AgentToolId;
  label: string;
  risk: "read_only" | "proposal" | "sensitive";
  requiresApproval: boolean;
  evidence: string;
  limit: string;
};

export const AGENT_TOOL_REGISTRY: readonly AgentToolDefinition[] = [
  { id: "public_research", label: "Публичное исследование", risk: "read_only", requiresApproval: false, evidence: "Публичные URL, выдержки и время получения", limit: "Только публичные источники; действуют лимиты и тайм-ауты" },
  { id: "github_manifest", label: "GitHub public manifest", risk: "read_only", requiresApproval: false, evidence: "URL репозитория, ветка и ограниченный manifest файлов", limit: "Только публичные репозитории; без clone и запуска кода" },
  { id: "selected_file_review", label: "Ревью выбранных файлов", risk: "read_only", requiresApproval: false, evidence: "Выводы, пути, выдержки и шаги проверки", limit: "До шести одобренных текстовых файлов; без бинарных файлов и .env" },
  { id: "architecture_map", label: "Карта архитектуры", risk: "read_only", requiresApproval: false, evidence: "Компоненты, пути, риски и неопределённости", limit: "Только по выбранному файловому контексту" },
  { id: "engineering_assessment", label: "Quality gate", risk: "proposal", requiresApproval: false, evidence: "Предложенные тесты и проверяемые категории", limit: "Предложения не являются выполненными тестами" },
  { id: "project_planner", label: "Ограниченный план проекта", risk: "proposal", requiresApproval: false, evidence: "Шаги, бюджет контекста и evidence завершения", limit: "2–12 шагов; без заявления о неограниченном контексте" },
  { id: "execution_preview", label: "Предпросмотр исполнения", risk: "proposal", requiresApproval: false, evidence: "Хеш кода, ограничения и неизменяемый запрос", limit: "Код никогда не выполняется" },
  { id: "external_execution", label: "Изолированный worker", risk: "sensitive", requiresApproval: true, evidence: "Образ worker, digest кода, stdout/stderr, статус и время", limit: "Требует настроенный изолированный worker и отдельное точное подтверждение" },
] as const;

export type AgentRunbookStep = {
  index: number;
  tool: AgentToolDefinition;
  status: "ready" | "requires_context" | "requires_approval";
  purpose: string;
};

export type AgentRunbook = {
  goal: string;
  summary: string;
  blocked: boolean;
  blockedReason?: string;
  steps: AgentRunbookStep[];
  constraints: string[];
};

function tool(id: AgentToolId) {
  const found = AGENT_TOOL_REGISTRY.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown agent tool: ${id}`);
  return found;
}

/** Creates an inspectable plan; it does not call a model, execute code, or access a repository. */
export function createAgentRunbook(goal: string): AgentRunbook {
  const text = goal.trim();
  const lower = text.toLowerCase();
  const blockedReason = /(?:обойди|bypass|jailbreak|слит(?:ый|ые|ь)|leaked\s+(?:api\s*)?key|украден|cloudflare)/i.test(text)
    ? "Запрос содержит обход защиты, утечку или неавторизованный доступ; AI 4.0 не строит для этого план действий."
    : undefined;
  if (blockedReason) {
    return { goal: text, summary: "План не создан.", blocked: true, blockedReason, steps: [], constraints: ["Нет обходов защиты, утечек, украденных ключей или неавторизованного доступа."] };
  }
  const selected: { id: AgentToolId; purpose: string; context?: boolean }[] = [];
  if (/(?:новост|исслед|research|найди|источник|документац)/i.test(lower)) selected.push({ id: "public_research", purpose: "Собрать публичные источники с URL и временем получения." });
  if (/(?:github|репозитор|manifest|дерево файлов)/i.test(lower)) selected.push({ id: "github_manifest", purpose: "Получить только manifest публичного репозитория без clone и запуска." });
  if (/(?:review|ревью|ошибк|баг|исправ)/i.test(lower)) selected.push({ id: "selected_file_review", purpose: "Проверить только явно выбранные текстовые файлы.", context: true });
  if (/(?:архитектур|компонент|поток|схем)/i.test(lower)) selected.push({ id: "architecture_map", purpose: "Построить доказательную карту компонентов и неопределённостей.", context: true });
  if (/(?:тест|quality|качеств|безопасност|зависимост)/i.test(lower)) selected.push({ id: "engineering_assessment", purpose: "Сформировать предложенные тесты и quality gate без ложного статуса выполнения.", context: true });
  if (/(?:больш|план|создай|реализ|сделай)/i.test(lower)) selected.push({ id: "project_planner", purpose: "Разбить задачу на ограниченные шаги с evidence для завершения." });
  if (/(?:запусти|выполни|команд|docker|python|интерпретатор)/i.test(lower)) selected.push({ id: "external_execution", purpose: "Подготовить чувствительное действие для отдельного worker; без подтверждения запуск не происходит." });
  if (!selected.length) selected.push({ id: "project_planner", purpose: "Сначала структурировать задачу в ограниченный и проверяемый план." });
  const deduplicated = selected.filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
  return {
    goal: text,
    summary: `Подготовлен ограниченный runbook: ${deduplicated.length} инструмент(а/ов), без автоматических внешних действий.`,
    blocked: false,
    steps: deduplicated.map((item, index) => {
      const definition = tool(item.id);
      return { index: index + 1, tool: definition, purpose: item.purpose, status: definition.requiresApproval ? "requires_approval" : item.context ? "requires_context" : "ready" };
    }),
    constraints: ["AI 4.0 показывает решение по инструменту и evidence до результата.", "Предложения изменений остаются read-only.", "Чувствительные действия требуют отдельного подтверждения для точного payload.", "Контекст и число шагов ограничены; отсутствующие данные отмечаются явно."],
  };
}
