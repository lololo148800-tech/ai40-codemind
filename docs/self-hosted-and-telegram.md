# AI40: self-hosted inference и Telegram-ready слой

## Что добавлено

AI40 теперь может использовать управляемый runtime по умолчанию либо **OpenAI-compatible self-hosted endpoint**, выбранный только на сервере через `AI40_SELF_HOSTED_BASE_URL`. Если endpoint требует учётные данные, `AI40_SELF_HOSTED_API_KEY` также остаётся только на сервере. Мобильный клиент не получает ни URL приватной сети, ни ключ провайдера; внешний клиент по-прежнему использует ограниченный AI40 API-ключ.

Self-hosted режим может убрать оплату стороннему API-провайдеру, но не делает вычисления бесконечными: модель, контекст, память, GPU/CPU и хостинг по-прежнему имеют реальные пределы. Для production endpoint должен быть HTTPS. Публичный endpoint без отдельной защиты использовать не следует.

| Переменная | Назначение | Где хранить |
| --- | --- | --- |
| `AI40_SELF_HOSTED_BASE_URL` | Базовый URL совместимого `/v1` inference API | Только server environment |
| `AI40_SELF_HOSTED_API_KEY` | Необязательный ключ к private inference endpoint | Только server environment |
| `TELEGRAM_BOT_TOKEN` | Токен бота для проверки Mini App initData | Только server environment |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет заголовка webhook | Только server environment |
| `APP_PUBLIC_URL` | Публичный HTTPS URL приложения | Только server environment |

## Telegram boundary

Добавлен маршрут `POST /api/telegram/webhook`. Он принимает только корректно подписанные обновления и возвращает быстрый ответ. На этой стадии он намеренно **не запускает команды, не вызывает модель, не пересылает файлы и не отправляет сообщения**. Это исключает неявное выполнение по входящему сообщению до подключения отдельного reviewable worker-а с явным одобрением.

Telegram отправляет обновления на HTTPS webhook и передаёт значение `secret_token` в заголовке `X-Telegram-Bot-Api-Secret-Token`; одновременно с webhook нельзя использовать `getUpdates`.[1] Для Mini App уже добавлена server-side функция проверки `initData` с проверкой подписи и срока действия. Перед тем как создавать пользовательскую сессию, интеграция обязана вызвать её; Telegram также требует не доверять `initData` без серверной валидации.[2]

## Как включить после публикации

Сначала создайте бота у BotFather и внесите значения через менеджер секретов хостинга. После появления HTTPS-домена укажите `APP_PUBLIC_URL`, затем установите webhook на `https://<домен>/api/telegram/webhook` с `secret_token`. Не вводите токен бота, ключ self-hosted модели или AI40 API-key в мобильное приложение, репозиторий, issue или чат.

## Что из вложений использовано

Материалы проверены как недоверенные данные и **не запускались**. В AI40 независимо реализованы совместимые идеи: безопасная классификация конфигурации, разделение публичного интерфейса и server secrets, webhook secret validation, HTTPS-путь Mini App и запрет неявного запуска кода из загруженных материалов. Архив не добавляется в проект и не попадёт в checkpoint.

## References

[1]: https://core.telegram.org/bots/api "Telegram Bot API: setWebhook and secret token"
[2]: https://core.telegram.org/bots/webapps "Telegram Mini Apps: initData validation"
