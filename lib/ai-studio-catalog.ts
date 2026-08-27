import type { ComponentProps } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type StudioReadiness = "ready" | "brief" | "setup";

export type StudioFlow = {
  id: string;
  title: string;
  summary: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
  color: string;
  readiness: StudioReadiness;
  label: string;
  route: string;
  output: string;
};

export type StudioSection = { id: string; title: string; caption: string; flows: StudioFlow[] };

export const AI_STUDIO_SECTIONS: StudioSection[] = [
  { id: "engineer", title: "Код и продукты", caption: "План → review → проверяемый запуск", flows: [
    { id: "code", title: "Код на любом языке", summary: "Задача, контекст, 10 ролей, критик и read-only code review для вставленного кода.", icon: "code", color: "#4F46E5", readiness: "ready", label: "Готово", route: "/agent", output: "Runbook, review и approval-only plan" },
    { id: "website", title: "Сайт и HTML", summary: "Структура страниц, UX, контент, технический план и проверка публичных URL.", icon: "language", color: "#2563EB", readiness: "ready", label: "Готово", route: "/link-explorer", output: "Web brief и безопасный link trail" },
    { id: "bot", title: "Боты и автоматизация", summary: "Проектирование API, webhook, команды, ограничения и test checklist без самовольной публикации.", icon: "smart-toy", color: "#0F9E88", readiness: "ready", label: "Готово", route: "/agent", output: "Bot architecture и approval checklist" },
    { id: "app", title: "Приложения и APK", summary: "План экранов, тестов, CI evidence и debug APK workflow в GitHub.", icon: "phone-android", color: "#7C3AED", readiness: "ready", label: "CI готов", route: "/github", output: "Mobile runbook и CI/Artifact evidence" },
  ] },
  { id: "create", title: "Медиа и документы", caption: "Точный brief перед подключением генератора", flows: [
    { id: "image", title: "Изображения", summary: "Промпт, референсы, формат, стиль и правила редактирования для image workflow.", icon: "image", color: "#A049C5", readiness: "brief", label: "Brief готов", route: "/?mode=create", output: "Image generation brief" },
    { id: "audio", title: "Аудио и музыка", summary: "Текст, голос, язык, тайминг и требования к звуку до generation job.", icon: "graphic-eq", color: "#D97706", readiness: "brief", label: "Brief готов", route: "/?mode=create", output: "Audio or music brief" },
    { id: "video", title: "Видео", summary: "Сценарий, сцены, длительность, формат и acceptance criteria для video workflow.", icon: "video-library", color: "#E25555", readiness: "brief", label: "Brief готов", route: "/?mode=create", output: "Video production brief" },
    { id: "docs", title: "Слайды и данные", summary: "Структура слайдов, источники, таблицы, расчёты и требования к результату.", icon: "dashboard", color: "#15803D", readiness: "brief", label: "Brief готов", route: "/?mode=create", output: "Document/data plan" },
  ] },
  { id: "knowledge", title: "Исследование и ссылки", caption: "Проверяемые открытые источники", flows: [
    { id: "research", title: "Deep Research", summary: "Вопрос, границы, источники, гипотезы и план проверки данных.", icon: "travel-explore", color: "#0F9E88", readiness: "ready", label: "Готово", route: "/?mode=research", output: "Research plan" },
    { id: "links", title: "Цепочка ссылок", summary: "Ограниченный public HTTPS обход с переходами по явно выбранным ссылкам.", icon: "account-tree", color: "#2563EB", readiness: "ready", label: "Готово", route: "/link-explorer", output: "Read-only link trail" },
    { id: "ai", title: "Создать AI-проект", summary: "Выбор задач, данных, evaluation и deployment boundary для собственного AI-продукта.", icon: "psychology", color: "#9C3DB1", readiness: "ready", label: "Готово", route: "/agent", output: "AI system architecture" },
  ] },
];

export function findStudioFlow(id: string) {
  return AI_STUDIO_SECTIONS.flatMap((section) => section.flows).find((flow) => flow.id === id);
}
