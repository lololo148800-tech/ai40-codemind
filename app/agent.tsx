/** Source: ai40_codemind_v7_full_source.zip → agent.tsx; adapted to the current local-first mobile UI. */
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

function tone(status: string): "neutral" | "ready" | "warning" | "blocked" {
  if (status === "ready") return "ready";
  if (status === "requires_approval" || status === "requires_context") return "warning";
  if (status === "blocked") return "blocked";
  return "neutral";
}

export default function AgentScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState("Проанализируй мой публичный GitHub-репозиторий, сделай review, предложи тесты и подготовь безопасный план исправлений.");
  const [error, setError] = useState("");
  const createRunbook = trpc.agent.createRunbook.useMutation();
  const runbook = createRunbook.data?.runbook;

  const start = async () => {
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

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="ИЗ ВАШЕГО AI40 CODEMIND" title="Agent Runbook" action={<IconAction icon="close" label="Закрыть runbook" onPress={() => router.back()} />} />
        <Ai40Card style={styles.intro}>
          <StatusPill label="Ваш модуль" tone="ready" />
          <Text style={styles.introTitle}>Прозрачный план действий</Text>
          <Text style={styles.introBody}>Модуль перенесён из вашего AI40 CodeMind. Он подбирает ограниченные инструменты, показывает риск и evidence, но не запускает команды, не меняет файлы и не работает со скрытыми источниками.</Text>
        </Ai40Card>
        <Ai40Card style={styles.formCard}>
          <Text style={styles.label}>Цель runbook</Text>
          <TextInput value={goal} onChangeText={setGoal} multiline style={styles.input} placeholder="Опишите цель" placeholderTextColor="#7886A8" textAlignVertical="top" editable={!createRunbook.isPending} />
          <Text style={styles.hint}>Если задаче нужен внешний запуск, runbook покажет отдельный шаг «требуется подтверждение» — запуск не производится.</Text>
          <PrimaryButton label={createRunbook.isPending ? "Создаю runbook…" : "Создать runbook"} onPress={() => { void start(); }} icon="smart-toy" disabled={createRunbook.isPending} />
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
                    <StatusPill label={`${step.index}. ${step.tool.label}`} tone={tone(step.status)} />
                    <Text style={styles.stepStatus}>{step.status.replace("_", " ")}</Text>
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
  stepStatus: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  stepPurpose: { color: palette.ink, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  stepMeta: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  constraint: { color: palette.muted, fontSize: 11, lineHeight: 16 },
});
