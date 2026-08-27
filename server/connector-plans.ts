export const CONNECTOR_PROVIDERS = ["github", "browser", "google", "manus", "telegram", "social"] as const;
export type ConnectorProvider = (typeof CONNECTOR_PROVIDERS)[number];
export type ConnectorReadiness = "available" | "setup_required" | "browser_required";

export type ConnectorStatus = {
  provider: ConnectorProvider;
  title: string;
  status: ConnectorReadiness;
  description: string;
  allowed: string;
  notAllowed: string;
};

const CATALOG: Record<ConnectorProvider, ConnectorStatus> = {
  github: { provider: "github", title: "GitHub", status: "setup_required", description: "CI Dashboard и private mirror уже поддерживают GitHub workflow evidence.", allowed: "После OAuth-подключения: выбранные репозитории, Actions runs и артефакты в заданном scope.", notAllowed: "Нет доступа к репозиториям, пока пользователь явно не выберет и не авторизует их." },
  browser: { provider: "browser", title: "Разрешённый браузер", status: "setup_required", description: "Нужен для личных сайтов, сессий и страниц с JavaScript.", allowed: "Только текущая разрешённая browser session и только после действия пользователя.", notAllowed: "Нет обхода входа, CAPTCHA, paywall и чужих cookie." },
  google: { provider: "google", title: "Google", status: "browser_required", description: "Публичные Google URL могут зависеть от consent и JavaScript.", allowed: "Разрешённый браузер или официальный Google data connector с выбранным scope.", notAllowed: "Нет автоматического scraping поисковой выдачи и личных данных." },
  manus: { provider: "manus", title: "Manus", status: "browser_required", description: "Ссылки Manus часто относятся к конкретному пользователю или задаче.", allowed: "Только пользовательская browser session и явно открытая страница.", notAllowed: "Нет чтения закрытых задач или подмены сессии." },
  telegram: { provider: "telegram", title: "Telegram", status: "setup_required", description: "AI40 содержит Telegram-ready проверку webhook и Mini App initData.", allowed: "После добавления bot token через защищённое хранение: webhook только с secret token.", notAllowed: "Нет токена в APK, нет незащищённого webhook и нет автопостинга без approval." },
  social: { provider: "social", title: "Социальные сервисы", status: "setup_required", description: "Свежие данные требуют официального API или разрешённой сессии конкретного сервиса.", allowed: "Только официальный connector, явно выданный пользователем scope и read-only запрос по задаче.", notAllowed: "Нет обхода приватности, массового scraping или публикации без approval." },
};

export function listConnectorStatuses() { return Object.values(CATALOG); }

export function buildConnectorAccessPlan(provider: ConnectorProvider, purpose: string) {
  const selected = CATALOG[provider];
  return {
    ...selected,
    purpose: purpose.trim(),
    nextStep: selected.status === "available" ? "Откройте соответствующий AI40 workflow." : "Подключите только этот provider через защищённый OAuth/API connector, выберите минимальный scope и вернитесь к задаче.",
    approval: "Подключение, публикация, изменение данных и каждая внешняя операция требуют отдельного явного подтверждения.",
  };
}
