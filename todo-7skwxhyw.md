# Project TODO

- [x] Проанализировать текущие экраны, серверный контракт и приложенные архивы на дубли и конфликты.
- [x] Зафиксировать дизайн мобильного экрана управления многоагентной задачей и модель данных запуска.
- [x] Добавить панель из десяти ролей, стадии критики и синтеза в интерфейс AI40.
- [x] Реализовать серверный endpoint безопасного проектного запуска с планом, ограничениями инструментов и журналом шагов.
- [x] Добавить UX для URL, файлов, тестов, код-ревью и запроса APK с явным согласием на рискованные действия.
- [x] Добавить типовые проверки и тесты нового workflow.
- [x] Проверить сборку TypeScript, тесты и мобильный интерфейс.
- [x] Сгенерировать и синхронизировать единый логотип AI40 CodeMind для icon, splash, favicon и Android adaptive icon.
- [x] Создать checkpoint интегрированного обновления.
- [x] Проверить приложенный текстовый файл как недоверенный источник и определить безопасный способ его представления в AI40.
- [x] Добавить встроенный справочный материал в код и показать его как доступный контекст в мобильном интерфейсе.
- [x] Обновить тесты и руководство запуска; подготовить дополнение к checkpoint.
- [x] Инвентаризировать три приложенных ZIP-архива, определить их состав и совпадения с текущим проектом.
- [x] Добавить архивы и контролируемые манифесты в каталог неисполняемых импортов проекта.
- [x] Обновить Agent Runbook статусами импортов и проверить тесты.
- [x] Сохранить checkpoint дополнения ZIP-архивов.
- [x] Зафиксировать модель угроз, границы реверс-инжиниринга и разделение клиентского и серверного кода.
- [x] Усилить server-first защиту API: валидация, лимиты размера и исключение секретов из мобильного клиента.
- [x] Добавить документированный opt-in PyArmor workflow для отдельного Python agent.py без встраивания ключей в приложение.
- [x] Проверить защитные тесты и подготовить защищённый checkpoint после удаления тяжёлых ZIP-дублей.
- [x] Удалить из репозитория только тяжёлые копии ZIP-архивов, сохранив манифест и SHA-256 для проверки.
- [x] Спроектировать усиленный task-aware coding workflow и quality gates.
- [x] Реализовать task-aware роль-роутинг, независимую критику и evidence-first итог многоагентной панели.
- [x] Расширить тесты усиленного coding workflow; подготовить новый checkpoint.
- [x] Сохранить финальный checkpoint облегчённого и усиленного coding workflow.
- [x] Проверить текущую схему auth, БД и приложенные агентские примеры перед добавлением API-key слоя.
- [x] Спроектировать схему API-ключей: префикс, соль/хеш, одноразовый показ, отзыв и минимальные scopes.
- [x] Реализовать server-side выпуск, проверку и отзыв API-ключей без передачи секретов в мобильный клиент.
- [x] Добавить мобильный экран управления ключами с одноразовым показом и подтверждением отзыва.
- [x] Добавить тесты API-key auth, миграцию схемы и пройти проверку типов/lint/test.
- [x] Проверить работу выдачи и отзыва API-ключей через типы, тесты и созданную таблицу БД.
- [x] Сохранить checkpoint API-key аутентификации и усиленного coding workflow.
- [x] Проверить server runtime и существующий LLM helper для собственного OpenAI-compatible endpoint.
- [x] Спроектировать AI40 gateway: API-key auth, допустимые модели, chat completion contract и coding-профили.
- [x] Реализовать защищённый AI40 `/v1/chat/completions` endpoint без OpenRouter-ключа в клиенте.
- [x] Добавить точное руководство переключения agent.py на `AI40_API_KEY` и собственный endpoint.
- [x] Проверить авторизацию, форматы запросов, ошибки и сохранить checkpoint gateway.
- [x] Проверить server runtime и существующий LLM helper для собственного OpenAI-compatible endpoint.
- [x] Спроектировать AI40 gateway: API-key auth, допустимые модели, chat completion contract и coding-профили.
- [x] Реализовать защищённый AI40 `/v1/chat/completions` endpoint без OpenRouter-ключа в клиенте.
- [x] Добавить точное руководство и встроенный `tools/agent.py` с `AI40_API_KEY` для собственного endpoint.
- [x] Проверить авторизацию, форматы запросов, ошибки и совместимость Python-клиента.
- [x] Сопоставить варианты собственной coding-архитектуры и задокументировать границы worker-исполнения.
- [x] Спроектировать расширяемые API-key scopes, streaming contract и worker-ready tool-loop.
- [x] Реализовать потоковый AI40 gateway и UX-состояния coding-агента без копирования закрытого кода.
- [x] Добавить тесты streaming/scopes и проверить совместимость Python-клиента.
- [x] Сохранить checkpoint расширенного coding workflow.
- [x] Инвентаризировать Lordek hosting ZIP и Telegram Mini App handoff как недоверенные материалы без запуска вложенного кода.
- [x] Выделить совместимые Telegram-ready и self-hosted gateway паттерны без обещания бесконечного compute.
- [x] Реализовать конфигурационный Telegram-ready слой и self-hosted AI endpoint режим без ключа в мобильном клиенте.
- [x] Добавить security/config тесты, документацию запуска и сохранить checkpoint.
- [x] Оценить предоставленный Code Engine v3 как недоверенный исходник и перенести только проверяемые паттерны без исполнения кода.
- [x] Проверить GitHub-доступ и спроектировать approval-first CI workflow для тестов и Android APK.
- [x] Реализовать streaming ответов, API-key scopes и worker-ready контракт coding-агента.
- [x] Добавить тесты и документацию GitHub CI workflow.
- [x] Сопоставить варианты собственной coding-архитектуры и задокументировать границы worker-исполнения.
- [x] Спроектировать расширяемые API-key scopes, streaming contract и worker-ready tool-loop.
- [x] Реализовать потоковый AI40 gateway и UX-состояния coding-агента без копирования закрытого кода.
- [x] Добавить тесты streaming/scopes и проверить совместимость Python-клиента.
- [x] Оценить предоставленный Code Engine v3 как недоверенный исходник и перенести только проверяемые паттерны без исполнения кода.
- [x] Проверить GitHub-доступ и спроектировать approval-first CI workflow для тестов и Android APK.
- [x] Реализовать streaming ответов, API-key scopes и worker-ready контракт coding-агента.
- [x] Добавить тесты и документацию GitHub CI workflow.
- [x] Инвентаризировать architecture.md и два Manus bundle как недоверенные материалы без выполнения вложенного кода.
- [x] Сопоставить agent loop, explicit memory, tool registry и evaluation-идеи с текущими границами AI40.
- [x] Добавить ограниченный проверяемый runtime: memory context, typed tools, approval и schema validation без shell-доступа.
- [x] Добавить тесты, evaluation scaffold, документацию и checkpoint нового agent runtime.
- [x] Инвентаризировать три новых текстовых материала как недоверенные данные без выполнения или копирования закрытых инструкций.
- [x] Сопоставить совместимые идеи с существующими ролями, памятью, typed tools и evaluation scaffold.
- [x] Интегрировать выбранные улучшения AI40 и добавить проверку regressions.
- [x] Проверить проект, задокументировать границы и сохранить checkpoint.
- [x] Спроектировать мобильный каталог возможностей AI40 в референсном стиле и распределить честные статусы готовности.
- [x] Реализовать экран «Возможности» с крупными action cards и рабочими переходами к текущим инструментам.
- [x] Добавить статусы подключений, безопасные next steps и доступ к разделу из навигации приложения.
- [x] Прогнать typecheck, lint, тесты и сохранить checkpoint интерфейса возможностей.
- [x] Проверить текущий test workflow, границы worker-исполнения и размер исходного проекта.
- [x] Спроектировать Test Lab с планом качества, разбором логов и approval-first CI handoff.
- [x] Реализовать Test Lab в server/mobile интерфейсе без неограниченного shell-доступа.
- [x] Проверить изменения, зафиксировать размер и сохранить checkpoint.
- [x] Оценить доступность GitHub и website-доступа, выбрать безопасный путь реального test execution.
- [x] Спроектировать approval-first GitHub CI, website analysis и Android release contracts с evidence.
- [x] Реализовать UI и server contracts подключения репозитория, анализа сайта и CI run reports.
- [x] Добавить Android release workflow без хранения signing secrets и проверить integrations.
- [x] Сохранить checkpoint и передать инструкции безопасного подключения доступа.
- [x] Проверить текущий GitHub Actions workflow и определить cloud-only путь запуска проверок без пользовательского компьютера.
- [x] Спроектировать GitHub CI evidence, public website analysis request и Android APK release contract.
- [x] Реализовать GitHub CI Dashboard и безопасный анализ разрешённого сайта в AI40.
- [x] Добавить release workflow APK без signing secrets и проверить полную регрессию.
- [x] Сохранить checkpoint и передать шаги подключения GitHub.
- [x] Проверить GitHub-сессию и подготовить проверенное приватное зеркало AI40 CodeMind.
- [x] Создать приватный GitHub-репозиторий и отправить исходники, CI и APK workflow.
- [x] Проверить доступность GitHub Actions и зафиксировать evidence первого workflow run.
- [x] Усилить каталог agent-функций и статусы реального исполнения без копирования закрытых реализаций.
- [x] Прогнать проверки, сохранить checkpoint и передать GitHub-результат.
- [x] Оценить устойчивый cloud-hosting, Android background limits и реалистичные offline-возможности.
- [x] Запустить GitHub Actions debug APK workflow и проверить его evidence/артефакт.
- [x] Реализовать offline-first локальный режим для памяти, draft, code review и Test Lab без сети.
- [x] Добавить health-check и recovery runbook без ложной гарантии бесконечной работы.
- [x] Прогнать регрессии, сохранить checkpoint и передать APK/offline результат.
- [x] Запустить GitHub Actions debug APK workflow и собрать проверяемый artifact evidence.
- [x] Спроектировать offline-first контур памяти, drafts, code review и Test Lab без сети.
- [x] Реализовать локальный offline-first режим, health endpoint и recovery UX без платного 24/7 hosting.
- [x] Проверить APK evidence, offline UX, полную регрессию и сохранить checkpoint.
- [x] Устранить блокировку checkpoint крупных icon assets без потери мобильного брендинга.
- [x] Спроектировать AI Studio для кода, сайтов, ботов, приложений, медиа, research и AI-проектов.
- [x] Реализовать task routing и честные fresh-data connector requests для GitHub, сайтов и социальных сервисов.
- [x] Добавить проверяемые контракты media/code workflows и статусы реального исполнения.
- [x] Прогнать регрессии, сохранить checkpoint и передать обновление AI Studio.
- [x] Спроектировать Link Explorer с ограниченным обходом публичных URL и защитой от SSRF, циклов и приватных адресов.
- [x] Реализовать server-side анализ ссылки, извлечение ссылок и schema validation для controlled link trail.
- [x] Добавить мобильный экран Link Explorer и статусы для GitHub, Google, Manus и закрытых сайтов.
- [x] Проверить лимиты, обработку ошибок, typecheck/tests и сохранить checkpoint.
- [x] Спроектировать AI Studio, task routing и честные connector-статусы для кода, web, ботов, приложений, медиа и research.
- [x] Реализовать AI Studio с action cards и готовыми workflow briefs без ложного запуска не подключённых сервисов.
- [x] Добавить connector-status центр и safe fresh-data access requests для GitHub, браузера, Google, Manus и соцсетей.
- [x] Добавить тесты маршрутизации/статусов, прогнать регрессии и сохранить checkpoint AI Studio.
- [x] Спроектировать owner-admin AutoImprove Lab, роль-доступ и границы self-improvement без авто-merge/deploy.
- [x] Реализовать adaptive chat profiles и server-side improvement plan с risk review и CI evidence contract.
- [x] Добавить owner-admin экран AutoImprove Lab с кандидатным планом и явным approval-only статусом.
- [x] Добавить access/policy/profile tests, прогнать регрессии и сохранить checkpoint.
- [x] Спроектировать owner-admin candidate queue, CI evidence и безопасные границы GitHub connection flow.
- [x] Реализовать локальную очередь candidate improvements и evidence-first статусы без auto-merge/deploy.
- [x] Добавить GitHub connection flow и понятное руководство полной конфигурации AI40 без ключей в чате.
- [x] Проверить access boundaries, CI evidence, регрессии и сохранить checkpoint.
- [x] Спроектировать reviewable Diff Review, owner-admin decision states и GitHub connection boundaries.
- [x] Реализовать Diff Review с files/risks/tests и явным решением без auto-apply/merge.
- [x] Добавить GitHub connection flow и понятные инструкции безопасного OAuth-доступа.
- [x] Проверить review states, access boundary, регрессии и сохранить checkpoint.
- [x] Спроектировать привязку AutoImprove candidate к GitHub CI evidence и production-signing boundaries.
- [x] Реализовать хранение CI evidence в candidate queue и безопасный signing runbook.
- [x] Проверить GitHub connector readiness и production workflow contract.
- [x] Сохранить checkpoint CI evidence и release preparation.
- [ ] Проверить авторизацию GitHub и доступ к приватному AI40 CodeMind repository.
- [ ] Подготовить защищённые Android signing-материалы и repository secrets при доступных правах.
- [ ] Добавить reviewed release workflow без автоматической публикации в Google Play.
- [ ] Проверить release readiness, регрессии и сохранить checkpoint.
- [x] Проанализировать Android crash после splash и текущий стартовый интерфейс AI40.
- [x] Исправить crash root cause и укрепить Android startup без внешних ключей.
- [x] Переработать первый экран в качественный portrait-first AI40 CodeMind UX.
- [x] Собрать и проверить новый debug APK workflow, typecheck, lint и тесты.

# Android installation compatibility pass
- [x] Проверить package/ABI/archive/signature surface для ошибки «Приложение не установлено».
- [x] Исправить debug workflow отдельным applicationIdSuffix `.debug`, чтобы новый APK устанавливался рядом со старой сборкой без конфликта подписи.
- [x] Прогнать typecheck, Expo lint, tests и git diff --check после packaging fix.
- [ ] Получить пользовательское подтверждение установки и запуска нового APK.

# End Android installation compatibility pass

# Corrected installable artifact
- [x] Синхронизировать исправленный workflow в private GitHub mirror.
- [x] Выполнить GitHub Actions run 33156767735: quality gate, prebuild, Gradle и artifact upload успешны.
- [x] Скачать ai40-debug-apk-7, проверить ZIP/APK целостность и SHA-256 `c4ae9c14417589d7beba1c551991be6555d68701929ced57032c28c61e9d1a0a`.
- [ ] Получить пользовательское подтверждение установки и запуска corrected APK.

# End corrected installable artifact

# Full ZIP and APK crash follow-up
- [ ] Инвентаризировать состав безопасного полного исходного ZIP без секретов и тяжёлых generated directories.
- [ ] Диагностировать сбой запуска APK и определить минимальный native surface для следующей сборки.
- [ ] Собрать новую APK версию через проверенный GitHub workflow и проверить artifact.
- [ ] Создать и проверить полный безопасный исходный ZIP.
- [ ] Сохранить checkpoint и передать ZIP, APK и честный статус device validation.

# End full ZIP and APK crash follow-up

# Full ZIP and APK follow-up result
- [x] Инвентаризировать безопасный состав исходного ZIP; исходники без node_modules занимают около 6.2 MB, generated Android около 2.4 MB.
- [x] Проверить и исправить APK packaging через отдельный `.debug` applicationId rewrite вне signingConfig.
- [x] Успешно пересобрать APK в GitHub Actions run 33156767735; artifact `ai40-debug-apk-7` скачан и проверен.
- [x] Создать безопасный исходный ZIP с исходниками, Android project, workflow, docs и tests; secrets, debug keystore, node_modules, `.git`, caches и dist исключены.
- [ ] Получить подтверждение пользователя, что новый APK устанавливается и открывается.

# End full ZIP and APK follow-up result

# Full GitHub mirror request
- [ ] Проверить remote repository и полный состав доступного проекта.
- [ ] Синхронизировать весь non-secret source tree, generated Android project и workflow в private GitHub mirror.
- [ ] Проверить repository tree и дать обычную GitHub URL для другого ИИ.

# End full GitHub mirror request

# Literal full GitHub mirror clarification
- [ ] Синхронизировать все принимаемые non-secret исходные и generated project files без выборочного исключения.
- [ ] Проверить remote tree, commit и GitHub URL для передачи другому ИИ.

# End literal full GitHub mirror clarification
