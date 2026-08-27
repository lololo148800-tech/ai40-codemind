/** Multi-agent project review workspace: analysis and planning only, with no shell or device execution. */
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const INTENTS = [
  { id: "code_review", label: "Ревью" },
  { id: "bug_hunt", label: "Баги" },
  { id: "architecture", label: "Архитектура" },
  { id: "test_plan", label: "Тесты" },
  { id: "apk_plan", label: "APK" },
] as const;

type PanelIntent = (typeof INTENTS)[number]["id"];

function runbookTone(status: string): "neutral" | "ready" | "warning" | "blocked" {
  if (status === "ready") return "ready";
  if (status === "requires_approval" || status === "requires_context") return "warning";
  if (status === "blocked") return "blocked";
  return "neutral";
}

function roleTone(status: string): "neutral" | "ready" | "warning" | "blocked" {
  if (status === "completed") return "ready";
  if (status === "failed") return "blocked";
  if (status === "unavailable") return "warning";
  return "neutral";
}

function gateTone(status: string): "neutral" | "ready" | "warning" | "blocked" {
  if (status === "ready_to_plan") return "ready";
  if (status === "needs_context") return "warning";
  if (status === "degraded" || status === "blocked") return "blocked";
  return "neutral";
}

export default function AgentScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState("Проанализируй мой публичный GitHub-репозиторий, сделай review, предложи тесты и подготовь безопасный план исправлений.");
  const [intent, setIntent] = useState<PanelIntent>("code_review");
  const [context, setContext] = useState("");
  const [error, setError] = useState("");

  const createRunbook = trpc.agent.createRunbook.useMutation();
  const runPanel = trpc.agent.runPanel.useMutation();
  const capabilities = trpc.agent.capabilities.useQuery();
  const runbook = createRunbook.data?.runbook;
  const panel = runPanel.data;

  const buildRunbook = async () => {
    if (goal.trim().length < 3) {
      setError("Опишите цель минимум тремя символами.");
      return;
    }
    setError("");
    try {
      await createRunbook.mutateAsync({ goal: goal.trim() });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Не удалось подготовить runbook.");
    }
  };

  const executePanel = async () => {
    setError("");
    try {
      await runPanel.mutateAsync({ goal: goal.trim(), intent, context: context.trim() || undefined });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Не удалось запустить многоагентную панель.");
    }
  };

  const requestPanelRun = () => {
    if (goal.trim().length < 3) {
      setError("Опишите цель минимум тремя символами.");
      return;
    }
    Alert.alert(
      "Запустить анализ из 10 ролей?",
      "На серверный AI-анализ будут переданы цель и необязательный вставленный контекст. Панель формирует выводы и quality gate; она не изменяет файлы, не запускает команды и не собирает APK.",
      [{ text: "Отмена", style: "cancel" }, { text: "Запустить анализ", onPress: () => { void executePanel(); } }],
    );
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="AI40 CODEMIND" title="Agent Runbook" action={<IconAction icon="close" label="Закрыть runbook" onPress={() => router.back()} />} />
        <Ai40Card style={styles.intro}>
          <StatusPill label="10 ролей + критик" tone="ready" />
          <Text style={styles.introTitle}>Многоагентный центр разработки</Text>
          <Text style={styles.introBody}>Девять независимых инженерных ролей анализируют цель параллельно, после чего отдельный критик сверяет их выводы, а синтезатор строит evidence-first результат. Экран не имитирует правки, тесты или сборку APK.</Text>
        </Ai40Card>

        <Ai40Card style={styles.referenceCard}>
          <StatusPill label="Справочный импорт" tone="neutral" />
          <Text style={styles.referenceTitle}>Mega AI Bot v3 добавлен в проект</Text>
          <Text style={styles.referenceText}>{capabilities.data ? `Импортировано профилей: ${capabilities.data.importedReference.importedProfiles}; активных ролей: ${capabilities.data.importedReference.activeRoles}. Реальные model ID выбираются только из текущего server catalog.` : "Проверяю каталог ролей…"}</Text>
        </Ai40Card>

        {capabilities.data ? (
          <Ai40Card style={styles.referenceCard}>
            <StatusPill label={`${capabilities.data.importedArchives.length} ZIP-импорта`} tone="neutral" />
            <Text style={styles.referenceTitle}>Архивы сохранены как ссылки на вложения</Text>
            {capabilities.data.importedArchives.map((archive) => (
              <View style={styles.archiveRow} key={archive.file}>
                <View style={styles.archiveCopy}>
                  <Text style={styles.archiveTitle}>{archive.title}</Text>
                  <Text style={styles.archiveMeta}>{archive.files.toLocaleString("ru-RU")} файл(а/ов) · SHA-256 сохранён в манифесте</Text>
                </View>
                <StatusPill label="В чате" tone="neutral" />
              </View>
            ))}
            <Text style={styles.referenceText}>Оригиналы остаются вложениями чата. Они не запускаются, не распаковываются поверх рабочего кода и не дают автоматический доступ к внешним сервисам.</Text>
          </Ai40Card>
        ) : null}

        <Ai40Card style={styles.formCard}>
          <Text style={styles.label}>Цель задачи</Text>
          <TextInput value={goal} onChangeText={setGoal} multiline style={styles.input} placeholder="Опишите цель" placeholderTextColor="#7886A8" textAlignVertical="top" editable={!createRunbook.isPending && !runPanel.isPending} />
          <Text style={styles.label}>Режим панели</Text>
          <View style={styles.intentRow}>
            {INTENTS.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => setIntent(item.id)} style={({ pressed }) => [styles.intentChip, intent === item.id && styles.intentChipActive, pressed && styles.intentChipPressed]}>
                <Text style={[styles.intentText, intent === item.id && styles.intentTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Контекст для анализа — необязательно</Text>
          <TextInput value={context} onChangeText={setContext} multiline maxLength={12_000} style={styles.contextInput} placeholder="Вставьте фрагмент кода, лог ошибки или публичный URL. Это недоверенный контекст." placeholderTextColor="#7886A8" textAlignVertical="top" editable={!runPanel.isPending} />
          <Text style={styles.hint}>Runbook создаёт быстрый план без LLM-вызовов. Полный запуск передаёт на сервер только цель и контекст после вашего подтверждения.</Text>
          <PrimaryButton label={createRunbook.isPending ? "Создаю runbook…" : "Создать runbook"} onPress={() => { void buildRunbook(); }} icon="smart-toy" disabled={createRunbook.isPending || runPanel.isPending} />
          <PrimaryButton label={runPanel.isPending ? "Панель анализирует…" : "Запустить анализ из 10 ролей"} onPress={requestPanelRun} icon="auto-awesome" disabled={runPanel.isPending || createRunbook.isPending} />
        </Ai40Card>

        {error ? <Ai40Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Ai40Card> : null}

        {runbook ? (
          <View style={styles.runbook}>
            <SectionTitle title="Текущий runbook" caption={runbook.blocked ? "Заблокирован" : "Proposal only"} />
            <Ai40Card style={runbook.blocked ? styles.blockedCard : styles.resultCard}>
              <StatusPill label={runbook.blocked ? "Заблокировано" : "План подготовлен"} tone={runbook.blocked ? "blocked" : "ready"} />
              <Text style={styles.resultTitle}>{runbook.summary}</Text>
              {runbook.blockedReason ? <Text style={styles.blockedReason}>{runbook.blockedReason}</Text> : null}
              {runbook.steps.map((step) => (
                <View style={styles.step} key={`${step.index}-${step.tool.id}`}>
                  <View style={styles.stepTop}><StatusPill label={`${step.index}. ${step.tool.label}`} tone={runbookTone(step.status)} /><Text style={styles.stepStatus}>{step.status.replaceAll("_", " ")}</Text></View>
                  <Text style={styles.stepPurpose}>{step.purpose}</Text>
                  <Text style={styles.stepMeta}>Risk: {step.tool.risk} · Evidence: {step.tool.evidence}</Text>
                  <Text style={styles.stepMeta}>Ограничение: {step.tool.limit}</Text>
                </View>
              ))}
              {runbook.constraints.map((constraint) => <Text style={styles.constraint} key={constraint}>• {constraint}</Text>)}
            </Ai40Card>
          </View>
        ) : null}

        {panel ? (
          <View style={styles.runbook}>
            <SectionTitle title="Многоагентный анализ" caption={panel.blocked ? "Заблокирован" : "Только анализ"} />
            <Ai40Card style={panel.blocked ? styles.blockedCard : styles.resultCard}>
              <StatusPill label={panel.blocked ? "Заблокировано" : "Панель завершена"} tone={panel.blocked ? "blocked" : "ready"} />
              <Text style={styles.resultTitle}>{panel.blocked ? panel.blockedReason : "Роли завершили независимый анализ. Этот результат не означает, что команды уже запущены, файлы изменены или APK собран."}</Text>
              {panel.roles.map((role) => (
                <View style={styles.step} key={`${role.id}-${role.model ?? "none"}`}>
                  <View style={styles.stepTop}><StatusPill label={role.title} tone={roleTone(role.status)} /><Text style={styles.stepStatus}>{role.model ?? "нет модели"} · {role.priority}</Text></View>
                  <Text style={styles.stepPurpose}>{role.content}</Text>
                  <Text style={styles.evidenceText}>{role.evidence.join(" ")}</Text>
                </View>
              ))}
              <View style={styles.gateBox}>
                <View style={styles.stepTop}><Text style={styles.synthesisLabel}>Quality gate</Text><StatusPill label={panel.qualityGate.status.replaceAll("_", " ")} tone={gateTone(panel.qualityGate.status)} /></View>
                <Text style={styles.gateText}>Уверенность: {panel.qualityGate.confidence} · успешных ролей: {panel.qualityGate.completedRoles}/10</Text>
                <Text style={styles.gateText}>{panel.qualityGate.nextStep}</Text>
                {panel.qualityGate.failedRoles.length ? <Text style={styles.gateText}>Недоступны: {panel.qualityGate.failedRoles.join(", ")}</Text> : null}
                {panel.qualityGate.missingPrimaryRoles.length ? <Text style={styles.gateText}>Требуют повтора: {panel.qualityGate.missingPrimaryRoles.join(", ")}</Text> : null}
                <Text style={styles.gateText}>{panel.qualityGate.approvalRequired}</Text>
              </View>
              <View style={styles.synthesisBox}><Text style={styles.synthesisLabel}>Итоговый синтез</Text><Text style={styles.synthesisText}>{panel.synthesis}</Text></View>
              <Text style={styles.executionNote}>Статус: {panel.execution === "analysis_only" ? "только анализ; выполнение не запускалось" : panel.execution}</Text>
            </Ai40Card>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28, gap: 16 },
  intro: { gap: 9, backgroundColor: "#F1FAF8", borderColor: "#CDEBE5" },
  introTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  introBody: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  referenceCard: { gap: 7, backgroundColor: "#F7F7FB", borderColor: "#DFE1EB" },
  referenceTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  referenceText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  archiveRow: { flexDirection: "row", gap: 10, alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 9 },
  archiveCopy: { flex: 1, gap: 2 },
  archiveTitle: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  archiveMeta: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  formCard: { gap: 10 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  input: { minHeight: 112, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: "#FAFAFC", color: palette.ink, padding: 12, fontSize: 13, lineHeight: 19 },
  contextInput: { minHeight: 92, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: "#FAFAFC", color: palette.ink, padding: 12, fontSize: 12, lineHeight: 18 },
  intentRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  intentChip: { minHeight: 34, borderRadius: 11, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 10, justifyContent: "center", backgroundColor: "#FFFFFF" },
  intentChipActive: { backgroundColor: palette.indigo, borderColor: palette.indigo },
  intentChipPressed: { opacity: 0.76 },
  intentText: { color: palette.muted, fontSize: 11, fontWeight: "800" },
  intentTextActive: { color: "#FFFFFF" },
  hint: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  errorCard: { backgroundColor: "#FFF4F4", borderColor: "#F3CECE" },
  errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  runbook: { gap: 8 },
  resultCard: { gap: 10, backgroundColor: "#F7FCFA", borderColor: "#D8F0E8" },
  blockedCard: { gap: 10, backgroundColor: "#FFF7F7", borderColor: "#F4D9D9" },
  resultTitle: { color: palette.ink, fontSize: 15, fontWeight: "800", lineHeight: 21 },
  blockedReason: { color: palette.danger, fontSize: 13, lineHeight: 19 },
  step: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 11, gap: 5 },
  stepTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  stepStatus: { color: palette.muted, fontSize: 10, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  stepPurpose: { color: palette.ink, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  evidenceText: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  stepMeta: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  constraint: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  gateBox: { marginTop: 3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 12, gap: 6 },
  gateText: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  synthesisBox: { marginTop: 3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 12, gap: 5 },
  synthesisLabel: { color: palette.indigo, fontSize: 12, fontWeight: "800" },
  synthesisText: { color: palette.ink, fontSize: 13, lineHeight: 19 },
  executionNote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
});
