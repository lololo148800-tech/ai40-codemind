import type { AssistantMode } from "./assistant";

export type ChatProfileId = "direct" | "research" | "engineering" | "review" | "creator";

export type ChatProfile = {
  id: ChatProfileId;
  label: string;
  instruction: string;
};

const PROFILES: Record<ChatProfileId, ChatProfile> = {
  direct: { id: "direct", label: "Практичный диалог", instruction: "Сначала дай прямой, краткий ответ. Затем предложи проверяемый следующий шаг и отметь неизвестное." },
  research: { id: "research", label: "Исследователь", instruction: "Разделяй факты, гипотезы и план проверки. Используй только явный контекст и не выдумывай источники." },
  engineering: { id: "engineering", label: "Инженер", instruction: "Строй реалистичное решение: цель, компоненты, ограничения, тесты и acceptance criteria. Не заявляй, что код изменён или CI запущен без evidence." },
  review: { id: "review", label: "Код-ревьюер", instruction: "Ищи конкретные риски и баги во вставленном материале. Давай приоритет, объяснение, безопасную идею исправления и проверку." },
  creator: { id: "creator", label: "Продюсер", instruction: "Превращай идею в точный production brief: аудитория, формат, стиль, ограничения, шаги и критерий готовности." },
};

const REVIEW_HINT = /(?:review|ревью|bug|баг|ошибк|test|тест|lint|typecheck|trace|stack)/i;
const ENGINEERING_HINT = /(?:code|код|api|backend|frontend|html|python|typescript|бот|apk|приложен|сайт|github|ci)/i;
const CREATE_HINT = /(?:изображен|картинк|видео|аудио|музык|слайд|презентац|логотип)/i;

/** A transparent, bounded replacement for opaque "auto-prompts". User text chooses a task profile, never new privileges. */
export function selectChatProfile(mode: AssistantMode, message: string): ChatProfile {
  if (mode === "research") return PROFILES.research;
  if (mode === "create" || CREATE_HINT.test(message)) return PROFILES.creator;
  if (mode === "code" && REVIEW_HINT.test(message)) return PROFILES.review;
  if (mode === "code" || ENGINEERING_HINT.test(message)) return PROFILES.engineering;
  return PROFILES.direct;
}

export function listChatProfiles() { return Object.values(PROFILES); }
