import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, palette, PrimaryButton, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const SOURCES = [
  {
    id: "gemini-cli",
    title: "Google Gemini CLI",
    owner: "google-gemini/gemini-cli",
    url: "https://github.com/google-gemini/gemini-cli",
    description: "Публичный open-source проект для терминального ИИ-агента. Добавлен как справочный источник после аудита материалов.",
    license: "Apache-2.0",
  },
  {
    id: "copilot",
    title: "GitHub Copilot",
    owner: "Официальная страница",
    url: "https://github.com/features/copilot",
    description: "Официальное описание возможностей GitHub Copilot. Это внешняя справочная страница, а не исходный код для импорта.",
    license: "Справочный ресурс",
  },
];

export default function GithubScreen() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const importer = trpc.github.importManifest.useMutation();
  const ciRuns = trpc.ci.publicRuns.useMutation();
  const ciPlan = trpc.ci.connectionPlan.useMutation();
  const openSource = (url: string) => {
    void WebBrowser.openBrowserAsync(url, {
      toolbarColor: palette.indigo,
      controlsColor: "#FFFFFF",
      showTitle: true,
      enableDefaultShareMenuItem: true,
    });
  };
  const importManifest = async () => {
    try {
      await importer.mutateAsync({ repositoryUrl: repositoryUrl.trim() });
    } catch (error) {
      Alert.alert("Не удалось получить manifest", error instanceof Error ? error.message : "Проверьте ссылку и повторите запрос.");
    }
  };
  const loadCiRuns = async () => {
    try {
      await ciRuns.mutateAsync({ repositoryUrl: repositoryUrl.trim() });
    } catch (error) {
      Alert.alert("Не удалось получить CI runs", error instanceof Error ? error.message : "Проверьте публичную ссылку и повторите запрос.");
    }
  };
  const prepareCiPlan = async () => {
    try {
      await ciPlan.mutateAsync({ repositoryUrl: repositoryUrl.trim() });
    } catch (error) {
      Alert.alert("Не удалось подготовить план", error instanceof Error ? error.message : "Проверьте публичную ссылку и повторите запрос.");
    }
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={SOURCES}
        keyExtractor={(source) => source.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="ПРОВЕРЕННЫЕ ССЫЛКИ" title="GitHub" />
            <Ai40Card style={styles.policyCard}>
              <View style={styles.policyRow}>
                <MaterialIcons name="policy" size={22} color={palette.warning} />
                <View style={styles.policyCopy}>
                  <Text style={styles.policyTitle}>Прозрачный импорт</Text>
                  <Text style={styles.policyText}>Каталог создан по вашим материалам. Репозитории с предполагаемыми утечками или неподтверждёнными правами не добавлены. Содержимое по ссылкам не запускается и не копируется автоматически.</Text>
                </View>
              </View>
            </Ai40Card>
            <Ai40Card style={styles.importCard}>
              <View style={styles.importHeading}>
                <MaterialIcons name="account-tree" size={21} color={palette.indigo} />
                <View style={styles.importCopy}>
                  <Text style={styles.importTitle}>Импорт публичного manifest</Text>
                  <Text style={styles.importText}>Модуль перенесён из вашего AI40 CodeMind. Он читает только метаданные и дерево файлов публичного репозитория: без clone, установки зависимостей и запуска кода.</Text>
                </View>
              </View>
              <TextInput value={repositoryUrl} onChangeText={setRepositoryUrl} placeholder="https://github.com/owner/repository" placeholderTextColor="#8990A5" autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!importer.isPending} style={styles.urlInput} />
              <PrimaryButton label={importer.isPending ? "Получаю manifest…" : "Проверить manifest"} icon="account-tree" onPress={() => { void importManifest(); }} disabled={!repositoryUrl.trim() || importer.isPending} />
              {importer.data ? <View style={styles.manifestResult}><StatusPill label="Manifest готов" tone="ready" /><Text style={styles.manifestTitle}>{importer.data.fullName}</Text><Text style={styles.manifestMeta}>Ветка: {importer.data.defaultBranch} · записей: {importer.data.totalEntries}</Text><Text style={styles.manifestMeta}>Показано: {importer.data.files.length}{importer.data.truncated ? " · список ограничен" : ""}</Text></View> : null}
            </Ai40Card>
            <Ai40Card style={styles.ciCard}>
              <View style={styles.importHeading}>
                <MaterialIcons name="verified" size={21} color={palette.teal} />
                <View style={styles.importCopy}>
                  <Text style={styles.importTitle}>CI Dashboard</Text>
                  <Text style={styles.importText}>Получает только публичные статусы GitHub Actions. Запуск workflow, pull request и APK остаются действиями с отдельным подтверждением в GitHub.</Text>
                </View>
              </View>
              <View style={styles.ciButtons}>
                <PrimaryButton label={ciPlan.isPending ? "Готовлю план…" : "План подключения"} icon="fact-check" tone="soft" onPress={() => { void prepareCiPlan(); }} style={styles.ciButton} disabled={!repositoryUrl.trim() || ciPlan.isPending} />
                <PrimaryButton label={ciRuns.isPending ? "Проверяю…" : "Проверить CI"} icon="sync" onPress={() => { void loadCiRuns(); }} style={styles.ciButton} disabled={!repositoryUrl.trim() || ciRuns.isPending} />
              </View>
              {ciPlan.data ? <View style={styles.planResult}><StatusPill label="Approval-first" tone="warning" /><Text style={styles.accessPath}>{ciPlan.data.accessPath}</Text>{ciPlan.data.steps.map((step, index) => <Text style={styles.planStep} key={step}>{index + 1}. {step}</Text>)}<Text style={styles.manifestMeta}>{ciPlan.data.approvalRequired}</Text><Text style={styles.ciBoundary}>{ciPlan.data.boundary}</Text></View> : null}
              {ciRuns.data ? <View style={styles.runsResult}><StatusPill label={`CI runs: ${ciRuns.data.runs.length}`} tone="ready" />{ciRuns.data.runs.length === 0 ? <Text style={styles.manifestMeta}>Workflow runs пока не найдены. Добавьте workflow в GitHub-репозиторий и откройте PR или запустите его вручную.</Text> : ciRuns.data.runs.map((run) => <View key={run.id} style={styles.run}><View style={styles.runHead}><Text style={styles.runName}>{run.name}</Text><StatusPill label={run.conclusion === "success" ? "success" : run.conclusion ?? run.status} tone={run.conclusion === "success" ? "ready" : run.status === "completed" ? "warning" : "neutral"} /></View><Text style={styles.manifestMeta}>{run.branch} · {run.headSha} · {run.event}</Text><PrimaryButton label="Открыть run" icon="open-in-new" tone="soft" onPress={() => openSource(run.url)} style={styles.runOpen} /></View>)}<Text style={styles.manifestMeta}>{ciRuns.data.evidenceBoundary}</Text></View> : null}
            </Ai40Card>
            <Text style={styles.listLabel}>Доступные источники · {SOURCES.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Ai40Card style={styles.sourceCard}>
            <View style={styles.sourceTop}>
              <View style={styles.sourceIcon}><MaterialIcons name="code" size={22} color={palette.indigo} /></View>
              <View style={styles.sourceCopy}>
                <Text style={styles.sourceTitle}>{item.title}</Text>
                <Text style={styles.sourceOwner}>{item.owner}</Text>
              </View>
              <StatusPill label="Публичный" tone="ready" />
            </View>
            <Text style={styles.sourceDescription}>{item.description}</Text>
            <View style={styles.sourceFooter}>
              <Text style={styles.license}>{item.license}</Text>
              <PrimaryButton label="Открыть" icon="open-in-new" tone="soft" onPress={() => openSource(item.url)} style={styles.openButton} />
            </View>
          </Ai40Card>
        )}
        ListFooterComponent={(
          <Text style={styles.footer}>Ограничение первой версии: приложение открывает только проверенные внешние ссылки. Чтение манифеста публичного репозитория и выбор файлов будут добавлены отдельным подтверждаемым модулем.</Text>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingTop: 16, paddingBottom: 28 },
  header: { gap: 15, marginBottom: 1 },
  policyCard: { backgroundColor: "#FFF9ED", borderColor: "#F6E4B6" },
  policyRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  policyCopy: { flex: 1, gap: 4 },
  policyTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  policyText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  importCard: { gap: 11, backgroundColor: "#F5F6FF", borderColor: "#DADDFF" },
  ciCard: { gap: 11, backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" },
  importHeading: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  importCopy: { flex: 1, gap: 3 },
  importTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  importText: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  urlInput: { minHeight: 44, borderWidth: 1, borderColor: "#D6DAEC", backgroundColor: "#FFFFFF", color: palette.ink, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  manifestResult: { paddingTop: 2, gap: 4 },
  ciButtons: { flexDirection: "row", gap: 8 },
  ciButton: { flex: 1, minHeight: 38, borderRadius: 11, paddingHorizontal: 8 },
  planResult: { gap: 6, paddingTop: 2 },
  accessPath: { color: palette.teal, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  planStep: { color: palette.ink, fontSize: 12, lineHeight: 18 },
  ciBoundary: { color: palette.danger, fontSize: 11, lineHeight: 16, paddingTop: 2 },
  runsResult: { gap: 8, paddingTop: 2 },
  run: { gap: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#CFEDE7", paddingTop: 9 },
  runHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  runName: { flex: 1, color: palette.ink, fontSize: 13, fontWeight: "800" },
  runOpen: { alignSelf: "flex-start", minHeight: 32, paddingHorizontal: 10, borderRadius: 10 },
  manifestTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  manifestMeta: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  listLabel: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  sourceCard: { gap: 14 },
  sourceTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  sourceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.indigoSoft, alignItems: "center", justifyContent: "center" },
  sourceCopy: { flex: 1, gap: 3 },
  sourceTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  sourceOwner: { color: palette.muted, fontSize: 12 },
  sourceDescription: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  sourceFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  license: { color: palette.muted, fontWeight: "700", fontSize: 11 },
  openButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 12 },
  footer: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 4, paddingHorizontal: 4 },
});
