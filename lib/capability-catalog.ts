import type MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";

export type CapabilityState = "ready" | "setup" | "planned";

export type CapabilityItem = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  color: string;
  state: CapabilityState;
  stateLabel: string;
  route?: string;
  nextStep?: string;
};

export type CapabilitySection = {
  id: string;
  title: string;
  caption: string;
  items: CapabilityItem[];
};

export const CAPABILITY_SECTIONS: CapabilitySection[] = [
  {
    id: "work",
    title: "Рабочее пространство",
    caption: "Доступно сейчас",
    items: [
      { id: "files", title: "Файлы и материалы", description: "Добавляйте контекст, заметки и reference-материалы для задач.", icon: "attach-file", color: "#2563EB", state: "ready", stateLabel: "Готово", route: "/materials" },
      { id: "agent", title: "Agent Runbook", description: "10 ролей, критик, план, quality gate и проверяемый runtime.", icon: "hub", color: "#4F46E5", state: "ready", stateLabel: "Готово", route: "/agent" },
      { id: "review", title: "Локальный code review", description: "Проверьте вставленный код без запуска, доступа к файлам или сети.", icon: "fact-check", color: "#0F9E88", state: "ready", stateLabel: "Готово", route: "/agent" },
      { id: "test-lab", title: "Test Lab", description: "Готовьте CI runbook и разбирайте вставленные логи тестов, типов и линтера.", icon: "playlist-add-check", color: "#D97706", state: "ready", stateLabel: "Готово", route: "/test-lab" },
      { id: "memory", title: "Память агента", description: "Сохраняйте собственные факты о проекте с изоляцией по аккаунту.", icon: "psychology", color: "#9C3DB1", state: "ready", stateLabel: "Готово", route: "/memory" },
    ],
  },
  {
    id: "create",
    title: "Создать и исследовать",
    caption: "Планирование и подготовка",
    items: [
      { id: "research", title: "Deep Research", description: "Соберите вопрос, источники и границы исследования в рабочий план.", icon: "travel-explore", color: "#0F9E88", state: "ready", stateLabel: "Готово", route: "/?mode=research" },
      { id: "image", title: "Изображения", description: "Подготовьте задачу на генерацию или редактирование с точным brief.", icon: "image", color: "#A049C5", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
      { id: "audio", title: "Аудио и музыка", description: "Сформируйте brief для речи, звуковой дорожки или музыки.", icon: "graphic-eq", color: "#D97706", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
      { id: "video", title: "Видео", description: "Соберите сценарий, сцены, формат и критерии будущего ролика.", icon: "video-library", color: "#E25555", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
      { id: "slides", title: "Презентации", description: "Подготовьте структуру слайдов, факты, визуальные материалы и цели.", icon: "slideshow", color: "#5B5CE2", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
      { id: "sheet", title: "Таблицы и данные", description: "Опишите данные, расчёты, проверки и формат результата.", icon: "grid-on", color: "#15803D", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
    ],
  },
  {
    id: "build",
    title: "Собрать продукт",
    caption: "Безопасный workflow",
    items: [
      { id: "website", title: "Сайт", description: "Спроектируйте страницы, контент, адаптивность и тесты перед разработкой.", icon: "language", color: "#2563EB", state: "ready", stateLabel: "План", route: "/?mode=create" },
      { id: "app", title: "Приложение", description: "Создайте технический план, user flow и release checklist для мобильного приложения.", icon: "phone-android", color: "#7C3AED", state: "ready", stateLabel: "План", route: "/agent" },
      { id: "game", title: "Игра", description: "Подготовьте механику, арт-направление и список задач для игрового прототипа.", icon: "sports-esports", color: "#C2410C", state: "planned", stateLabel: "Подготовить", route: "/?mode=create" },
      { id: "apk", title: "APK и CI", description: "Постройте approval-first план проверки и release workflow без запуска сборки в приложении.", icon: "build-circle", color: "#4F46E5", state: "ready", stateLabel: "План", route: "/agent" },
    ],
  },
  {
    id: "connect",
    title: "Подключения и автоматизация",
    caption: "Только с явной настройкой",
    items: [
      { id: "github", title: "GitHub", description: "Просматривайте выбранные репозитории и готовьте quality gates для CI.", icon: "code", color: "#111827", state: "ready", stateLabel: "Готово", route: "/github" },
      { id: "gateway", title: "AI40 Gateway", description: "Проверьте self-hosted режим, ключи AI40 и Telegram-ready статус.", icon: "settings-ethernet", color: "#2563EB", state: "setup", stateLabel: "Настройка", route: "/infrastructure" },
      { id: "keys", title: "Ключи доступа", description: "Создавайте и отзывайте AI40 API keys; raw key показывается один раз.", icon: "key", color: "#0F9E88", state: "ready", stateLabel: "Готово", route: "/api-keys" },
      { id: "schedule", title: "Задачи по расписанию", description: "Нужен отдельный persistent worker; приложение не запускает фоновые процессы само.", icon: "schedule", color: "#6B7280", state: "setup", stateLabel: "Нужен worker", nextStep: "Сначала подключите изолированный persistent worker и определите разрешённые действия." },
      { id: "computer", title: "Подключить компьютер", description: "Нужен отдельный trusted device connector с явным доступом и журналом действий.", icon: "desktop-windows", color: "#6B7280", state: "setup", stateLabel: "Нужен connector", nextStep: "Сначала настройте trusted device connector; AI40 не получает доступ к компьютеру по умолчанию." },
    ],
  },
];

export const QUICK_CAPABILITY_IDS = ["agent", "files", "review"] as const;

export function getCapabilityById(id: string) {
  return CAPABILITY_SECTIONS.flatMap((section) => section.items).find((item) => item.id === id);
}
