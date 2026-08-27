export type ExecutionStatusTone = "ready" | "warning" | "neutral";

export type ExecutionStatus = {
  id: string;
  title: string;
  detail: string;
  label: string;
  tone: ExecutionStatusTone;
  route?: string;
  evidenceUrl?: string;
};

export const EXECUTION_STATUS: ExecutionStatus[] = [
  { id: "offline", title: "Offline-first локальный режим", detail: "История, материалы и детерминированный review/fallback доступны на устройстве без сети.", label: "Готово", tone: "ready", route: "/settings" },
  { id: "plan", title: "Планирование и роли", detail: "10 ролей, критик и quality gate работают до внешнего исполнения.", label: "Готово", tone: "ready", route: "/agent" },
  { id: "review", title: "Code review и Test Lab", detail: "AI40 проверяет вставленный код и логи без запуска непроверенных команд.", label: "Готово", tone: "ready", route: "/test-lab" },
  { id: "github-ci", title: "GitHub Quality Gate", detail: "Первый cloud run прошёл typecheck, lint и tests на приватном зеркале AI40.", label: "Подтверждено", tone: "ready", route: "/github", evidenceUrl: "https://github.com/lololo148800-tech/ai40-codemind/actions/runs/33077367454" },
  { id: "apk", title: "Android debug APK", detail: "Ручной workflow готовит unsigned debug APK только после quality gate; production signing пока не подключён.", label: "Готов к запуску", tone: "warning", route: "/github" },
  { id: "production", title: "Production release", detail: "Потребуются Android signing secrets и отдельное явное подтверждение release workflow.", label: "Нужна настройка", tone: "neutral", route: "/github" },
];

export function getExecutionStatus(id: string) {
  return EXECUTION_STATUS.find((entry) => entry.id === id);
}
