import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const TARGETS = [
  { id: "expo_node", label: "Expo / Node" },
  { id: "python", label: "Python" },
  { id: "generic", label: "Другой стек" },
] as const;

type TargetId = (typeof TARGETS)[number]["id"];

export default function TestLabScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [target, setTarget] = useState<TargetId>("expo_node");
  const [goal, setGoal] = useState("");
  const [log, setLog] = useState("");
  const [error, setError] = useState("");
  const plan = trpc.testLab.plan.useMutation();
  const analyze = trpc.testLab.analyzeLog.useMutation();

  const preparePlan = () => {
    if (!isAuthenticated) return setError("Войдите в проект, чтобы подготовить свой Test Lab runbook.");
    setError("");
    void plan.mutateAsync({ target, goal: goal.trim() || undefined }).catch((value) => setError(value instanceof Error ? value.message : "Не удалось подготовить тестовый план."));
  };

  const inspectLog = () => {
    if (!isAuthenticated) return setError("Войдите в проект, чтобы разбирать логи проверки.");
    if (!log.trim()) return setError("Вставьте вывод test, lint или typecheck команды.");
    setError("");
    void analyze.mutateAsync({ log: log.trim() }).catch((value) => setError(value instanceof Error ? value.message : "Не удалось разобрать лог."));
  };

  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenTitle eyebrow="AI40 QUALITY GATE" title="Test Lab" action={<IconAction icon="close" label="Закрыть Test Lab" onPress={() => router.back()} />} /><Ai40Card style={styles.hero}><StatusPill label="Approval-first" tone="warning" /><Text style={styles.title}>Проверки без фальшивого «готово»</Text><Text style={styles.text}>AI40 готовит точный runbook и разбирает вставленные логи. Он не запускает тесты, shell-команды или APK build с телефона. Реальный запуск — только в одобренном CI/worker.</Text></Ai40Card>{!isAuthenticated ? <Ai40Card style={styles.card}><StatusPill label="Нужен вход" tone="warning" /><Text style={styles.title}>Test Lab привязан к проектному аккаунту</Text><Text style={styles.text}>Войдите через «Ключи доступа» в настройках, чтобы подготовить runbook и разбирать результаты.</Text></Ai40Card> : <><Ai40Card style={styles.card}><Text style={styles.label}>Стек проекта</Text><View style={styles.chips}>{TARGETS.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => setTarget(item.id)} style={({ pressed }) => [styles.chip, target === item.id && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, target === item.id && styles.chipTextActive]}>{item.label}</Text></Pressable>)}</View><Text style={styles.label}>Цель проверки — необязательно</Text><TextInput value={goal} onChangeText={setGoal} style={styles.input} placeholder="Например: проверить изменения перед PR" placeholderTextColor="#7886A8" maxLength={500} /><PrimaryButton label={plan.isPending ? "Готовлю runbook…" : "Подготовить Test Lab runbook"} icon="playlist-add-check" onPress={preparePlan} disabled={plan.isPending} /></Ai40Card><Ai40Card style={styles.card}><Text style={styles.label}>Лог проверки</Text><TextInput value={log} onChangeText={setLog} multiline textAlignVertical="top" style={[styles.input, styles.logInput]} placeholder="Вставьте stdout/stderr test, lint или typecheck. AI40 только разбирает текст — ничего не запускает." placeholderTextColor="#7886A8" maxLength={20_000} editable={!analyze.isPending} /><PrimaryButton label={analyze.isPending ? "Разбираю лог…" : "Разобрать лог"} icon="manage-search" onPress={inspectLog} disabled={analyze.isPending || !log.trim()} /></Ai40Card></>}{error ? <Ai40Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Ai40Card> : null}{plan.data ? <View style={styles.result}><SectionTitle title="Ваш CI/worker runbook" caption="Ожидает approval" /><Ai40Card style={styles.card}><Text style={styles.title}>{plan.data.goal}</Text>{plan.data.commands.map((command) => <View key={command.id} style={styles.command}><Text style={styles.commandLabel}>{command.label}</Text><Text style={styles.code}>{command.command}</Text><Text style={styles.text}>{command.purpose}</Text></View>)}<Text style={styles.boundary}>{plan.data.workerBoundary}</Text></Ai40Card></View> : null}{analyze.data ? <View style={styles.result}><SectionTitle title="Разбор лога" caption={analyze.data.status.replaceAll("_", " ")} /><Ai40Card style={analyze.data.status === "passed_evidence_seen" ? styles.passedCard : styles.card}><StatusPill label={analyze.data.status === "passed_evidence_seen" ? "Evidence найден" : "Нужна проверка"} tone={analyze.data.status === "passed_evidence_seen" ? "ready" : "warning"} /><Text style={styles.title}>{analyze.data.summary}</Text><Text style={styles.text}>Строк: {analyze.data.linesRead} · passed: {analyze.data.totals.passed} · failed: {analyze.data.totals.failed} · skipped: {analyze.data.totals.skipped}</Text>{analyze.data.issues.map((issue, index) => <View style={styles.issue} key={`${issue.line}-${index}`}><Text style={styles.commandLabel}>Строка {issue.line}</Text><Text style={styles.text}>{issue.message}</Text></View>)}<Text style={styles.boundary}>Для доказательства запуска приложите commit SHA, полную команду, exit code и полный лог из CI/worker.</Text></Ai40Card></View> : null}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 16, paddingTop: 16, paddingBottom: 30 }, hero: { gap: 9, backgroundColor: "#FFF8EA", borderColor: "#F5DDAE" }, card: { gap: 10 }, passedCard: { gap: 10, backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" }, title: { color: palette.ink, fontSize: 15, fontWeight: "800" }, text: { color: palette.muted, fontSize: 13, lineHeight: 19 }, label: { color: palette.ink, fontSize: 13, fontWeight: "800" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { minHeight: 38, justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF", paddingHorizontal: 12 }, chipActive: { backgroundColor: palette.indigo, borderColor: palette.indigo }, chipText: { color: palette.ink, fontSize: 12, fontWeight: "800" }, chipTextActive: { color: "#FFFFFF" }, input: { minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12, paddingVertical: 10, color: palette.ink, fontSize: 13, backgroundColor: "#FAFAFC" }, logInput: { minHeight: 140, lineHeight: 18 }, result: { gap: 9 }, command: { gap: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 10 }, commandLabel: { color: palette.ink, fontSize: 12, fontWeight: "800" }, code: { color: "#3730A3", fontSize: 12, fontFamily: "monospace", padding: 9, borderRadius: 9, backgroundColor: "#F4F3FF" }, boundary: { color: palette.muted, fontSize: 12, lineHeight: 18, paddingTop: 4 }, issue: { gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 9 }, errorCard: { backgroundColor: "#FFF4F4", borderColor: "#FFD8D8" }, errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 }, pressed: { opacity: 0.72 } });
