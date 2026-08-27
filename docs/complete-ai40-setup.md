# Полная рабочая конфигурация AI40

AI40 уже работает как mobile + server проект: чат с adaptive profiles, Agent Runbook, Test Lab, Link Explorer, AI Studio, API keys, offline-first fallback, owner-admin AutoImprove Lab и GitHub CI workflow. Возможности включаются по отдельности, чтобы приложение не получало лишних прав.

| Цель | Что сделать один раз | Что AI40 сможет подтверждать evidence |
|---|---|---|
| Режим владельца | Войти в приложение через проектный OAuth | AutoImprove candidate plans и owner-admin risk review |
| Тесты и APK | Открыть приватный GitHub repository, включить Actions и запустить workflow вручную | CI run URL, typecheck/lint/tests и unsigned debug APK artifact |
| Свежие private данные | Подключить только нужный provider через защищённый connector flow | Статус разрешения и read-only получение доступных данных |
| Постоянная cloud-работа | Включить отдельный always-on hosting только после решения по расходам | Health/recovery status, но не «вечная» гарантия |
| Offline | Включить офлайн в настройках | Локальная история, материалы, Code Review и Test Lab без сети |

## Правило ключей

Никогда не отправляйте в чат API keys, passwords, OAuth codes или signing keys. AI40 API key используется только для AI40 gateway. GitHub, Google, Manus и социальные сервисы должны подключаться через их официальный OAuth/connector flow и с минимальными разрешениями.

## AutoImprove queue

Каждый candidate plan сначала сохраняется **локально** в AutoImprove Lab. Статусы `Candidate draft → Owner reviewed → Готово к CI` не означают, что изменения применены. Они фиксируют готовность перед отдельным review, CI запуском и явным решением owner-admin.

## Diff Review и GitHub

Diff Review принимает только **вставленный** unified diff, выделяет затронутые файлы, additions/deletions и рискованные сигналы. Он не читает реальные файлы, не применяет patch и не запускает команды. После owner-admin решения `Одобрить для CI` откройте вкладку **GitHub**, укажите ссылку на репозиторий и сначала запросите план подключения. Вход и grant прав выполняются только в официальном GitHub OAuth/connector flow; не вставляйте в чат personal access token, пароль или OAuth code.

## Сколько ключей нужно

Для AI40 на телефоне, local offline mode, AutoImprove и Diff Review не требуется ни один сторонний API key. Для private GitHub нужен официальный OAuth grant, а не personal access token в приложении. Подписанный production APK потребует один ваш Android signing key, переданный только через GitHub Secrets в четырёх защищённых полях. Подробный порядок находится в [Android release signing](./android-release-signing.md).
