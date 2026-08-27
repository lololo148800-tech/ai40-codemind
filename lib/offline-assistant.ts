import type { AssistantMode } from "./workspace-storage";

type OfflineAssistantInput = {
  message: string;
  mode: AssistantMode;
  selectedMaterialCount: number;
  cause: "manual" | "network";
};

const REVIEW_SIGNALS: Array<{ pattern: RegExp; label: string; severity: "high" | "medium" | "low" }> = [
  { pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{6,}/i, label: "возможный захардкоженный секрет", severity: "high" },
  { pattern: /\beval\s*\(|new\s+Function\s*\(/i, label: "dynamic execution", severity: "high" },
  { pattern: /\b(?:exec|spawn|child_process)\b/i, label: "вызов shell/process", severity: "medium" },
  { pattern: /\bTODO\b|\bFIXME\b/i, label: "незавершённая задача", severity: "low" },
  { pattern: /console\.(?:log|debug)|print\(/i, label: "debug-вывод", severity: "low" },
];

function findSignals(source: string) {
  return REVIEW_SIGNALS.filter(({ pattern }) => pattern.test(source));
}

/** A deterministic, bundled fallback. It never calls the server, network, shell, or external model. */
export function buildOfflineResponse({ message, mode, selectedMaterialCount, cause }: OfflineAssistantInput) {
  const prefix = cause === "network"
    ? "Связь с сервером недоступна — включён локальный fallback."
    : "Офлайн-режим включён — AI40 не отправлял запрос на сервер.";
  const materials = selectedMaterialCount ? ` В локальной библиотеке выбрано материалов: ${selectedMaterialCount}.` : "";

  if (mode === "code") {
    const signals = findSignals(message);
    const finding = signals.length
      ? signals.map(({ severity, label }) => `${severity}: ${label}`).join("; ")
      : "явных сигналов секретов, dynamic execution, shell-вызовов, TODO или debug-вывода не найдено";
    return `${prefix}${materials}\n\nОфлайн Code Review: ${finding}.\n\nДальше локально: 1) сохраните пример и ожидаемое поведение; 2) составьте минимальный test-case; 3) при появлении сети запустите Test Lab или GitHub CI для реального typecheck/lint/tests.`;
  }
  if (mode === "research") {
    return `${prefix}${materials}\n\nОфлайн Research Plan: сформулируйте вопрос, перечислите известные факты и источники, отметьте неизвестные пункты. AI40 сохранит этот диалог на устройстве; проверка внешних источников появится после восстановления сети.`;
  }
  if (mode === "create") {
    return `${prefix}${materials}\n\nОфлайн Build Plan: цель → пользовательский сценарий → данные → экраны/модули → проверки → критерий готовности. Для создания медиа, APK или публикации потребуется сеть и отдельное подтверждение.`;
  }
  return `${prefix}${materials}\n\nОфлайн-ответ сохранён локально. Я могу помочь разложить задачу на шаги, подготовить чек-лист и проверить вставленный фрагмент кода. Для анализа, генерации и внешних данных потребуется сеть.`;
}
