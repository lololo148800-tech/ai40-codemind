# AI40 Android: безопасная подготовка release APK

Текущий GitHub workflow `ai40-android-debug-artifact.yml` создаёт **unsigned debug APK**. Он годится для внутренней проверки, но не является release APK для постоянного распространения. Новый ручной workflow `AI40 Android release readiness` только подтверждает, что необходимые защищённые значения существуют. Он не декодирует keystore, не собирает APK, не публикует релиз и не выводит секреты в лог.

## Что действительно понадобится

Для production signing нужен один собственный **Android signing key** в виде keystore-файла. В GitHub Secrets это представляется четырьмя защищёнными полями: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` и `ANDROID_KEY_PASSWORD`. Это не ключи моделей, не OpenRouter и не токены для мобильного клиента. Их нельзя отправлять в чат, вставлять в исходники или сохранять в AsyncStorage.

| Задача | Что нужно от владельца | Сколько секретов/токенов |
|---|---|---:|
| Использовать AI40, offline и Diff Review | Ничего | 0 |
| Смотреть public CI evidence | Ссылка на публичный репозиторий | 0 |
| Работать с private GitHub repository | Один официальный OAuth grant с минимальными правами | 0 вставляемых токенов |
| Собрать подписанный release APK | Один Android signing key, сохранённый как 4 GitHub Secrets | 4 защищённых поля |
| Автоматически публиковать в Google Play | Отдельно, после review, Google Play service-account credential | 1 дополнительный защищённый credential |

## Порядок запуска

Сначала владелец создаёт или выбирает keystore вне исходного кода и хранит резервную копию в надёжном месте. Затем значения добавляются только в GitHub Secrets для выбранного private repository. После этого вручную запускается `AI40 Android release readiness` и проверяется его результат. Лишь после зелёного readiness и отдельного owner review можно добавлять workflow, который использует keystore для `assembleRelease` и создаёт артефакт. Публикация в Google Play остаётся отдельным подтверждаемым действием.

> AI40 не собирает release APK и не публикует приложение автоматически только потому, что signing secrets появились в GitHub. Такой шаг требует отдельного review и подтверждения владельца.
