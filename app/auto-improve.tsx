import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import {
  CANDIDATE_DECISION_LABEL,
  CANDIDATE_STATUS_LABEL,
  CI_CONCLUSION_LABEL,
  enqueueAutoImproveCandidate,
  isCandidateReadyForCiEvidence,
  listAutoImproveCandidates,
  setAutoImproveCandidateCiEvidence,
  setAutoImproveCandidateDecision,
  setAutoImproveCandidateStatus,
  type AutoImproveCandidate,
  type CandidateDecision,
  type CandidateStatus,
  type CiConclusion,
} from "@/lib/auto-improve-queue";
import { inspectCandidateDiff, type DiffReview } from "@/lib/diff-review";
import { trpc } from "@/lib/trpc";

const AREAS = [["quality", "Качество"], ["bugs", "Баги"], ["performance", "Скорость"], ["security", "Безопасность"], ["ux", "UX"], ["capability", "Возможность"]] as const;
const NEXT_STATUS: Record<CandidateStatus, CandidateStatus> = { draft: "reviewed", reviewed: "ci_ready", ci_ready: "ci_ready" };
const DECISIONS: [CandidateDecision, string][] = [["changes_requested", "Нужны правки"], ["approved_for_ci", "Одобрить для CI"], ["rejected", "Отклонить"]];
const CONCLUSIONS: CiConclusion[] = ["success", "failure", "cancelled", "timed_out", "action_required"];

type EvidenceDraft = { candidateId: string; runUrl: string; commitSha: string; conclusion: CiConclusion; artifactName: string };

export default function AutoImproveScreen() {
  const router = useRouter();
  const [requirement, setRequirement] = useState("");
  const [area, setArea] = useState<(typeof AREAS)[number][0]>("quality");
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<AutoImproveCandidate[]>([]);
  const [diffText, setDiffText] = useState("");
  const [diffReview, setDiffReview] = useState<DiffReview | null>(null);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft | null>(null);
  const plan = trpc.admin.autoImprovePlan.useMutation();
  const refresh = useCallback(() => { void listAutoImproveCandidates().then(setCandidates); }, []);
  useFocusEffect(refresh);

  const createPlan = () => {
    setError("");
    void plan.mutateAsync({ requirement: requirement.trim(), area })
      .then(async (result) => {
        const queued = await enqueueAutoImproveCandidate({ title: result.title, requirement: requirement.trim(), area, risk: result.risk, profileLabel: result.profile.label });
        setCandidates(queued.saved);
        setRequirement("");
      })
      .catch((value) => setError(value instanceof Error ? value.message : "Не удалось подготовить план."));
  };

  const advance = (candidate: AutoImproveCandidate) => {
    const next = NEXT_STATUS[candidate.status];
    if (next === candidate.status) return;
    void setAutoImproveCandidateStatus(candidate.id, next).then(setCandidates);
  };
  const decide = (candidate: AutoImproveCandidate, decision: CandidateDecision) => {
    void setAutoImproveCandidateDecision(candidate.id, decision).then(setCandidates);
  };
  const openEvidenceDraft = (candidate: AutoImproveCandidate) => {
    setError("");
    setEvidenceDraft({ candidateId: candidate.id, runUrl: candidate.ciEvidence?.runUrl ?? "", commitSha: candidate.ciEvidence?.commitSha ?? "", conclusion: candidate.ciEvidence?.conclusion ?? "success", artifactName: candidate.ciEvidence?.artifactName ?? "" });
  };
  const saveEvidence = () => {
    if (!evidenceDraft) return;
    setError("");
    void setAutoImproveCandidateCiEvidence(evidenceDraft.candidateId, evidenceDraft)
      .then((saved) => { setCandidates(saved); setEvidenceDraft(null); })
      .catch((value) => setError(value instanceof Error ? value.message : "Не удалось сохранить CI evidence."));
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle eyebrow="OWNER-ADMIN ONLY" title="AutoImprove Lab" action={<IconAction icon="close" label="Закрыть" onPress={() => router.back()} />} />
        <Ai40Card style={styles.policy}>
          <StatusPill label="Approval required" tone="ready" />
          <Text style={styles.title}>Самоулучшение — через evidence</Text>
          <Text style={styles.text}>Цель превращается в candidate plan и попадает в локальную очередь этого устройства. Ничего не меняется и не публикуется автоматически.</Text>
        </Ai40Card>
        <Ai40Card style={styles.card}>
          <Text style={styles.label}>Что улучшить</Text>
          <TextInput value={requirement} onChangeText={setRequirement} multiline maxLength={1_200} textAlignVertical="top" style={styles.input} placeholder="Например: уменьшить ошибки формы авторизации и добавить regression-тесты" placeholderTextColor="#7886A8" editable={!plan.isPending} />
          <Text style={styles.label}>Область</Text>
          <View style={styles.areaGrid}>{AREAS.map(([id, label]) => <Pressable key={id} accessibilityRole="button" onPress={() => setArea(id)} style={({ pressed }) => [styles.areaButton, area === id && styles.areaButtonActive, pressed && styles.pressed]}><Text style={[styles.areaText, area === id && styles.areaTextActive]}>{label}</Text></Pressable>)}</View>
          <PrimaryButton label={plan.isPending ? "Собираю candidate plan…" : "Добавить candidate"} icon="auto-fix-high" onPress={createPlan} disabled={requirement.trim().length < 8 || plan.isPending} />
        </Ai40Card>
        {error ? <Ai40Card style={styles.errorCard}><Text style={styles.error}>{error}</Text></Ai40Card> : null}
        {plan.data ? <Ai40Card style={styles.result}><View style={styles.resultHead}><StatusPill label={`Риск: ${plan.data.risk}`} tone={plan.data.risk === "low" ? "ready" : "neutral"} /><StatusPill label={plan.data.profile.label} tone="neutral" /></View><Text style={styles.planTitle}>{plan.data.title}</Text>{plan.data.riskNotes.map((note) => <Text key={note} style={styles.risk}>• {note}</Text>)}<View style={styles.divider} />{plan.data.steps.map((step, index) => <View key={step.id} style={styles.step}><Text style={styles.stepNumber}>{index + 1}</Text><View style={styles.stepCopy}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.text}>{step.evidence}</Text><Text style={styles.stepFlag}>{step.requiresApproval ? "Требует owner-admin approval" : "Подготовительный шаг"}</Text></View></View>)}<Text style={styles.boundary}>{plan.data.boundary}</Text></Ai40Card> : null}
        <View style={styles.queueHeader}><Text style={styles.sectionTitle}>Candidate queue</Text><Text style={styles.queueHint}>Локально · максимум 12</Text></View>
        {candidates.length ? candidates.map((candidate) => (
          <Ai40Card key={candidate.id} style={styles.queueItem}>
            <View style={styles.resultHead}><StatusPill label={CANDIDATE_STATUS_LABEL[candidate.status]} tone={candidate.status === "ci_ready" ? "ready" : "neutral"} /><StatusPill label={CANDIDATE_DECISION_LABEL[candidate.decision]} tone={candidate.decision === "approved_for_ci" ? "ready" : "neutral"} /></View>
            <Text style={styles.queueTitle}>{candidate.title}</Text><Text style={styles.text}>{candidate.profileLabel} · {candidate.area}</Text>
            {candidate.status !== "ci_ready" ? <Pressable accessibilityRole="button" onPress={() => advance(candidate)} style={({ pressed }) => [styles.queueButton, pressed && styles.pressed]}><Text style={styles.queueButtonText}>{candidate.status === "draft" ? "Отметить owner review" : "Подготовить к CI"}</Text></Pressable> : <Text style={styles.ciReady}>Следующий шаг: вручную запустить quality gate в GitHub.</Text>}
            <View style={styles.decisionRow}>{DECISIONS.map(([decision, label]) => <Pressable key={decision} accessibilityRole="button" onPress={() => decide(candidate, decision)} style={({ pressed }) => [styles.decisionButton, candidate.decision === decision && styles.decisionButtonActive, pressed && styles.pressed]}><Text style={[styles.decisionText, candidate.decision === decision && styles.decisionTextActive]}>{label}</Text></Pressable>)}</View>
            {candidate.ciEvidence ? <View style={styles.evidence}><StatusPill label={CI_CONCLUSION_LABEL[candidate.ciEvidence.conclusion]} tone={candidate.ciEvidence.conclusion === "success" ? "ready" : "neutral"} /><Text style={styles.evidenceMeta}>{candidate.ciEvidence.commitSha.slice(0, 12)} · {candidate.ciEvidence.artifactName ?? "без APK artifact"}</Text><Text numberOfLines={1} style={styles.evidenceUrl}>{candidate.ciEvidence.runUrl}</Text></View> : null}
            {isCandidateReadyForCiEvidence(candidate) ? <Pressable accessibilityRole="button" onPress={() => openEvidenceDraft(candidate)} style={({ pressed }) => [styles.evidenceButton, pressed && styles.pressed]}><Text style={styles.evidenceButtonText}>{candidate.ciEvidence ? "Изменить CI evidence" : "Прикрепить CI evidence"}</Text></Pressable> : null}
          </Ai40Card>
        )) : <Ai40Card style={styles.empty}><Text style={styles.text}>Очередь пуста. Добавь improvement goal, чтобы создать первый candidate plan.</Text></Ai40Card>}
        {evidenceDraft ? <Ai40Card style={styles.evidenceForm}><StatusPill label="Manual evidence" tone="warning" /><Text style={styles.title}>Прикрепить CI evidence</Text><Text style={styles.text}>Вставь фактические данные из уже завершённого GitHub Actions run. Это запись evidence, а не запуск workflow.</Text><TextInput value={evidenceDraft.runUrl} onChangeText={(runUrl) => setEvidenceDraft({ ...evidenceDraft, runUrl })} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://github.com/owner/repo/actions/runs/123" placeholderTextColor="#7886A8" style={styles.field} /><TextInput value={evidenceDraft.commitSha} onChangeText={(commitSha) => setEvidenceDraft({ ...evidenceDraft, commitSha })} autoCapitalize="none" autoCorrect={false} placeholder="Commit SHA" placeholderTextColor="#7886A8" style={styles.field} /><View style={styles.areaGrid}>{CONCLUSIONS.map((conclusion) => <Pressable key={conclusion} accessibilityRole="button" onPress={() => setEvidenceDraft({ ...evidenceDraft, conclusion })} style={({ pressed }) => [styles.areaButton, evidenceDraft.conclusion === conclusion && styles.areaButtonActive, pressed && styles.pressed]}><Text style={[styles.areaText, evidenceDraft.conclusion === conclusion && styles.areaTextActive]}>{CI_CONCLUSION_LABEL[conclusion]}</Text></Pressable>)}</View><TextInput value={evidenceDraft.artifactName} onChangeText={(artifactName) => setEvidenceDraft({ ...evidenceDraft, artifactName })} autoCapitalize="none" autoCorrect={false} placeholder="APK artifact (необязательно)" placeholderTextColor="#7886A8" style={styles.field} /><PrimaryButton label="Сохранить evidence" icon="verified" onPress={saveEvidence} /><Pressable accessibilityRole="button" onPress={() => setEvidenceDraft(null)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Отмена</Text></Pressable></Ai40Card> : null}
        <Ai40Card style={styles.diffCard}><View style={styles.resultHead}><StatusPill label="Read-only" tone="neutral" /><Text style={styles.queueHint}>Unified diff</Text></View><Text style={styles.title}>Diff Review</Text><Text style={styles.text}>Вставь candidate unified diff для статического review. AI40 не применит его и не откроет реальные файлы.</Text><TextInput value={diffText} onChangeText={setDiffText} multiline maxLength={40_000} textAlignVertical="top" style={styles.diffInput} placeholder={"--- a/app/example.tsx\n+++ b/app/example.tsx\n@@ ..."} placeholderTextColor="#7886A8" /><PrimaryButton label="Проверить diff" icon="fact-check" tone="soft" onPress={() => setDiffReview(inspectCandidateDiff(diffText))} disabled={!diffText.trim()} />{diffReview ? <View style={styles.diffResult}><StatusPill label={`Риск: ${diffReview.risk}`} tone={diffReview.risk === "low" ? "ready" : "neutral"} /><Text style={styles.text}>Файлов: {diffReview.files.length} · +{diffReview.additions} / −{diffReview.deletions} · hunk: {diffReview.hunks}</Text>{diffReview.files.map((file) => <Text key={file} style={styles.diffFile}>{file}</Text>)}{diffReview.flags.map((flag) => <Text key={flag} style={styles.risk}>• {flag}</Text>)}<Text style={styles.stepTitle}>Перед CI</Text>{diffReview.testChecklist.map((item) => <Text key={item} style={styles.text}>• {item}</Text>)}<Text style={styles.boundary}>{diffReview.boundary}</Text></View> : null}</Ai40Card>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/github" as never)} style={({ pressed }) => [styles.githubLink, pressed && styles.pressed]}><Text style={styles.githubText}>Открыть GitHub CI →</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { gap: 16, paddingTop: 16, paddingBottom: 30 }, policy: { gap: 9, backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" }, card: { gap: 10 }, title: { color: palette.ink, fontSize: 16, fontWeight: "900" }, text: { color: palette.muted, fontSize: 12, lineHeight: 18 }, label: { color: palette.ink, fontSize: 12, fontWeight: "800" }, input: { minHeight: 118, borderRadius: 12, borderWidth: 1, borderColor: palette.line, padding: 12, color: palette.ink, backgroundColor: "#FAFAFC", fontSize: 13, lineHeight: 19 }, areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, areaButton: { minHeight: 35, paddingHorizontal: 10, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF" }, areaButtonActive: { backgroundColor: "#F0F0FF", borderColor: palette.indigo }, areaText: { color: palette.muted, fontSize: 12, fontWeight: "800" }, areaTextActive: { color: palette.indigo }, errorCard: { backgroundColor: "#FFF4F4", borderColor: "#FFD8D8" }, error: { color: palette.danger, fontSize: 13, lineHeight: 18 }, result: { gap: 10, backgroundColor: "#F8F8FF", borderColor: "#DEDCFF" }, resultHead: { flexDirection: "row", gap: 7, flexWrap: "wrap" }, planTitle: { color: palette.ink, fontSize: 17, lineHeight: 23, fontWeight: "900" }, risk: { color: palette.muted, fontSize: 12, lineHeight: 18 }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line }, step: { flexDirection: "row", gap: 9 }, stepNumber: { color: "#FFFFFF", backgroundColor: palette.indigo, width: 22, height: 22, borderRadius: 11, overflow: "hidden", textAlign: "center", lineHeight: 22, fontSize: 12, fontWeight: "900" }, stepCopy: { flex: 1, gap: 2 }, stepTitle: { color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: "900" }, stepFlag: { color: palette.indigo, fontSize: 11, lineHeight: 16, fontWeight: "800" }, boundary: { color: palette.danger, fontSize: 12, lineHeight: 18, paddingTop: 3 }, queueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 3 }, sectionTitle: { color: palette.ink, fontSize: 16, fontWeight: "900" }, queueHint: { color: palette.muted, fontSize: 11, fontWeight: "700" }, queueItem: { gap: 7 }, queueTitle: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "900" }, queueButton: { alignSelf: "flex-start", borderRadius: 10, backgroundColor: palette.indigoSoft, paddingVertical: 8, paddingHorizontal: 11, marginTop: 2 }, queueButtonText: { color: palette.indigo, fontSize: 12, fontWeight: "900" }, ciReady: { color: palette.teal, fontSize: 11, lineHeight: 16, fontWeight: "800" }, decisionRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", paddingTop: 2 }, decisionButton: { borderRadius: 9, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF", paddingVertical: 7, paddingHorizontal: 9 }, decisionButtonActive: { backgroundColor: palette.indigoSoft, borderColor: palette.indigo }, decisionText: { color: palette.muted, fontSize: 11, fontWeight: "800" }, decisionTextActive: { color: palette.indigo }, evidence: { gap: 4, padding: 9, borderRadius: 10, backgroundColor: "#F1FAF8", borderWidth: 1, borderColor: "#CFEDE7" }, evidenceMeta: { color: palette.teal, fontSize: 11, lineHeight: 16, fontWeight: "800" }, evidenceUrl: { color: palette.muted, fontSize: 10, lineHeight: 15 }, evidenceButton: { alignSelf: "flex-start", borderRadius: 10, backgroundColor: "#F4F3FF", paddingVertical: 8, paddingHorizontal: 11 }, evidenceButtonText: { color: palette.indigo, fontSize: 12, fontWeight: "900" }, evidenceForm: { gap: 9, backgroundColor: "#F8F8FF", borderColor: "#DEDCFF" }, field: { minHeight: 43, borderRadius: 11, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 11, color: palette.ink, backgroundColor: "#FFFFFF", fontSize: 12 }, cancelButton: { minHeight: 34, alignItems: "center", justifyContent: "center" }, cancelText: { color: palette.muted, fontSize: 12, fontWeight: "800" }, diffCard: { gap: 9, backgroundColor: "#FFFDF8", borderColor: "#EFE0BF" }, diffInput: { minHeight: 140, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: "#151722", color: "#E5E7F1", fontFamily: "monospace", fontSize: 11, lineHeight: 16, padding: 11 }, diffResult: { gap: 6, paddingTop: 3 }, diffFile: { color: palette.indigo, fontSize: 11, fontFamily: "monospace", lineHeight: 16 }, empty: { backgroundColor: "#FAFAFC" }, githubLink: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "#DCD9FF", backgroundColor: "#F4F3FF", alignItems: "center", justifyContent: "center" }, githubText: { color: palette.indigo, fontSize: 13, fontWeight: "900" }, pressed: { opacity: 0.68 } });
