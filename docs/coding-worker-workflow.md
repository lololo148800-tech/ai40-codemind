# AI40 Coding Workflow

AI40 CodeMind строится по самостоятельному workflow: **контекст → параллельные роли → независимый критик → quality gate → явное approval → проверяемый CI**. Предоставленный Code Engine v3 использован только как источник общих идей: строгая типизация, ошибки, полный код и объяснение запуска. Его фрагменты не запускаются и не копируются как готовая реализация, поскольку приложенный текст является неполным и синтаксически невалидным псевдокодом.

## GitHub quality gate

Добавлен `.github/workflows/ai40-quality-gate.yml`. Когда исходники будут зеркалированы в GitHub-репозиторий, workflow проверит pull request или вручную запущенный workflow: locked dependency install, TypeScript, lint и Vitest. Он не изменяет файлы, не публикует приложение и не подписывает APK.

## Worker boundary

| Стадия | AI40 делает сейчас | Отдельный worker в будущем |
|---|---|---|
| Анализ | Роли, критик, evidence и quality gate | Не требуется |
| План изменений | Diff/test plan и явный список действий | Не требуется |
| Тесты | CI запускает `pnpm check`, `pnpm lint`, `pnpm test` | Может запускать ограниченный allowlist в clone проекта |
| APK | Проверяет readiness планом | Только отдельный signed release workflow после точного approval |

## Потоковый gateway

`POST /api/v1/chat/completions` поддерживает `stream: true` и возвращает OpenAI-compatible SSE. Встроенный runtime отдаёт ответ целиком, поэтому gateway отправляет один совместимый `delta` после завершения upstream-запроса, а не имитирует ложный token-by-token output. Это позволяет существующему `tools/agent.py --stream` записать результат корректно.

## Scopes

| Scope | Возможность |
|---|---|
| `chat:complete` | Text-only completion через AI40 Gateway |
| `models:read` | Список alias и live runtime models |
| `agent:run` | Многоагентная панель анализа |
| `worker:plan` | Только получение approval-first плана будущего worker |

Ни один scope не даёт shell-доступ, запись файлов, доступ к устройству, доступ к закрытому репозиторию или выпуск APK. Такие операции требуют отдельного изолированного исполнительного окружения, выбранного репозитория и точного approval.
