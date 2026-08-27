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

export default function AgentScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState("Проанализируй мой публичный GitHub-репозиторий, сделай review, предложи тесты и подготовь безопасный план исправлений.");
  const [intent, setIntent] = useState<PanelIntent>("code_review");
  const [context, setContext] = useState("");
  const [error, setError] = useState("");

  const createRunbook = trpc.agent.createRunbook.useMutation();
  const runPanel = trpc.agent.runPanel.useMutation();
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
      await runPanel.mutateAsync({
        goal: goal.trim(),
        intent,
        context: context.trim() || undefined,
      });
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
      "На серверный AI-анализ будут переданы цель и необязательный вставленный контекст. Панель формирует выводы и план; она не изменяет файлы, не запускает команды и не собирает APK.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Запустить анализ", onPress: () => { void executePanel(); } },
      ],
    );
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="AI40 CODEMIND" title="Agent Runbook" action={<IconAction icon="close" label="Закрыть runbook" onPress={() => router.back()} />} />

        <Ai40Card style={styles.intro}>
          <StatusPill label="10 ролей + синтез" tone="ready" />
          <Text style={styles.introTitle}>Многоагентный центр разработки</Text>
          <Text style={styles.introBody}>Десять независимых инженерных ролей анализируют одну цель параллельно, затем сильная модель собирает итог. Этот экран не имитирует правки, тесты или сборку APK: для таких действий нужен отдельный worker и точное подтверждение.</Text>
        </Ai40Card>

        <Ai40Card style={styles.formCard}>
          <Text style={styles.label}>Цель задачи</Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            multiline
            style={styles.input}
            placeholder="Опишите цель"
            placeholderTextColor="#7886A8"
            textAlignVertical="top"
            editable={!createRunbook.isPending && !runPanel.isPending}
          />

          <Text style={styles.label}>Режим панели</Text>
          <View style={styles.intentRow}>
            {INTENTS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setIntent(item.id)}
                style={({ pressed }) => [styles.intentChip, intent === item.id && styles.intentChipActive, pressed && styles.intentChipPressed]}
              >
                <Text style={[styles.intentText, intent === item.id && styles.intentTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Контекст для анализа — необязательно</Text>
          <TextInput
            value={context}
            onChangeText={setContext}
            multiline
            maxLength={12_000}
            style={styles.contextInput}
            placeholder="Вставьте фрагмент кода, лог ошибки или публичный URL. Это недоверенный контекст."
            placeholderTextColor="#7886A8"
            textAlignVertical="top"
            editable={!runPanel.isPending}
          />
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
                  <View style={styles.stepTop}>
                    <StatusPill label={`${step.index}. ${step.tool.label}`} tone={runbookTone(step.status)} />
                    <Text style={styles.stepStatus}>{step.status.replaceAll("_", " ")}</Text>
                  </View>
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
                  <View style={styles.stepTop}>
                    <StatusPill label={role.title} tone={roleTone(role.status)} />
                    <Text style={styles.stepStatus}>{role.model ?? "нет модели"}</Text>
                  </View>
                  <Text style={styles.stepPurpose}>{role.content}</Text>
                </View>
              ))}
              <View style={styles.synthesisBox}>
                <Text style={styles.synthesisLabel}>Итоговый синтез</Text>
                <Text style={styles.synthesisText}>{panel.synthesis}</Text>
              </View>
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
  stepMeta: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  constraint: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  synthesisBox: { marginTop: 3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 12, gap: 5 },
  synthesisLabel: { color: palette.indigo, fontSize: 12, fontWeight: "800" },
  synthesisText: { color: palette.ink, fontSize: 13, lineHeight: 19 },
  executionNote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
});
