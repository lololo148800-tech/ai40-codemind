export const TEST_TARGETS = ["expo_node", "python", "generic"] as const;
export type TestTarget = (typeof TEST_TARGETS)[number];

type TestCommand = { id: string; label: string; command: string; purpose: string };

const TARGET_COMMANDS: Record<TestTarget, TestCommand[]> = {
  expo_node: [
    { id: "types", label: "TypeScript", command: "pnpm check", purpose: "Проверить типы без генерации артефактов." },
    { id: "lint", label: "Линтинг", command: "pnpm lint", purpose: "Проверить статические правила проекта." },
    { id: "tests", label: "Unit-тесты", command: "pnpm test", purpose: "Запустить проверяемый набор Vitest." },
  ],
  python: [
    { id: "compile", label: "Компиляция", command: "python3 -m py_compile <target.py>", purpose: "Проверить синтаксис выбранного Python-модуля." },
    { id: "tests", label: "Тесты", command: "python3 -m pytest", purpose: "Запустить проектные тесты, если pytest указан в проекте." },
  ],
  generic: [
    { id: "discover", label: "Определить стек", command: "проверить package.json / pyproject.toml / README", purpose: "Сначала определить разрешённый test command проекта." },
    { id: "tests", label: "Запуск тестов", command: "выполнить только documented project test command", purpose: "Не подбирать shell-команды и не запускать неизвестный код." },
  ],
};

export function buildTestPlan(input: { target: TestTarget; goal?: string }) {
  const commands = TARGET_COMMANDS[input.target];
  return {
    target: input.target,
    goal: input.goal?.trim() || "Проверить изменения перед следующим этапом.",
    commands,
    approvalRequired: true,
    workerBoundary: "AI40 готовит список команд, но не запускает их в мобильном приложении. Реальный прогон происходит только в изолированном CI/worker после точного подтверждения.",
    evidenceRequired: ["commit SHA или версия исходников", "точная команда", "exit code", "stdout/stderr", "время запуска", "ссылки на артефакты при наличии"],
  };
}

export type TestLogIssue = { line: number; severity: "error" | "warning"; message: string };

/** Parses only user-pasted output. It neither runs commands nor opens project files. */
export function analyzeTestLog(rawLog: string) {
  const source = rawLog.slice(0, 20_000);
  const lines = source.split(/\r?\n/).slice(0, 2_000);
  const issues: TestLogIssue[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  lines.forEach((line, index) => {
    const vitest = line.match(/Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+skipped)?/i);
    if (vitest) {
      passed += Number(vitest[1]);
      skipped += Number(vitest[2] ?? 0);
    }
    const failedMatch = line.match(/(?:Tests|Test Files)\s+(\d+)\s+failed/i);
    if (failedMatch) failed += Number(failedMatch[1]);
    if (/\b(?:error|exception|traceback|failed|failure)\b/i.test(line) && !/\b(?:0 errors?|0 failed|no errors?)\b/i.test(line)) {
      issues.push({ line: index + 1, severity: /\b(?:error|exception|traceback|failed|failure)\b/i.test(line) ? "error" : "warning", message: line.trim().slice(0, 360) });
    }
  });

  const status = failed > 0 || issues.length > 0 ? "needs_attention" : passed > 0 ? "passed_evidence_seen" : "insufficient_evidence";
  return {
    status,
    linesRead: lines.length,
    truncated: rawLog.length > source.length || rawLog.split(/\r?\n/).length > lines.length,
    totals: { passed, failed, skipped },
    issues: issues.slice(0, 20),
    summary: status === "passed_evidence_seen"
      ? "В логе есть признаки успешного тестового прогона. Проверьте, что лог относится к нужному commit SHA."
      : status === "needs_attention"
        ? "В логе найдены ошибки или падения. AI40 не считает проверку пройденной."
        : "В логе недостаточно явных признаков результата. Добавьте полный вывод команды и exit code.",
  };
}
