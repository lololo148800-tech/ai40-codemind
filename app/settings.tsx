import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { clearWorkspaceData, getSettings, saveSettings, type WorkspaceSettings } from "@/lib/workspace-storage";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<WorkspaceSettings>({ sendSelectedContext: false, compactReplies: false });

  const refresh = useCallback(async () => setSettings(await getSettings()), []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const update = async (next: WorkspaceSettings) => {
    setSettings(next);
    await saveSettings(next);
  };

  const clearData = () => {
    Alert.alert("Очистить локальные данные?", "Будут удалены история чата, список материалов, настройки и локальные копии добавленных файлов. Это действие нельзя отменить.", [
      { text: "Отмена", style: "cancel" },
      { text: "Очистить", style: "destructive", onPress: () => { void clearWorkspaceData().then(() => router.back()); } },
    ]);
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenTitle eyebrow="КОНТРОЛЬ ДАННЫХ" title="Настройки" action={<IconAction icon="close" label="Закрыть настройки" onPress={() => router.back()} />} />
          <Text style={styles.lead}>Управляйте тем, какие локальные данные приложение может передавать в ИИ-диалог.</Text>
        </View>

        <View>
          <SectionTitle title="Приватность" />
          <Ai40Card style={styles.group}>
            <View style={styles.settingRow}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Передавать выбранный контекст</Text><Text style={styles.settingText}>Когда включено, текст материалов, которые вы отметили в библиотеке, добавляется к следующему сообщению ассистенту.</Text></View><Switch value={settings.sendSelectedContext} onValueChange={(value) => { void update({ ...settings, sendSelectedContext: value }); }} trackColor={{ false: "#D9DDE9", true: "#B8B5FF" }} thumbColor={settings.sendSelectedContext ? palette.indigo : "#FFFFFF"} /></View>
            <View style={styles.divider} />
            <View style={styles.settingRow}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Компактные ответы</Text><Text style={styles.settingText}>Сохраняет это предпочтение для следующих обновлений интерфейса и режимов ответа.</Text></View><Switch value={settings.compactReplies} onValueChange={(value) => { void update({ ...settings, compactReplies: value }); }} trackColor={{ false: "#D9DDE9", true: "#B8B5FF" }} thumbColor={settings.compactReplies ? palette.indigo : "#FFFFFF"} /></View>
          </Ai40Card>
        </View>

        <View>
          <SectionTitle title="Доступ к агенту" />
          <Ai40Card style={styles.infoCard}>
            <StatusPill label="Server-side API keys" tone="ready" />
            <Text style={styles.infoTitle}>Ключи доступа</Text>
            <Text style={styles.infoText}>Создавайте и отзывайте API-ключи для внешнего доступа к многоагентному анализу. Полный ключ показывается один раз, а на сервере сохраняется только его хеш.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/api-keys")} style={({ pressed }) => [styles.accessButton, pressed && styles.accessButtonPressed]}><Text style={styles.accessButtonText}>Управлять API-ключами</Text></Pressable>
          </Ai40Card>
          <Ai40Card style={styles.infoCard}>
            <StatusPill label="Explicit memory" tone="neutral" />
            <Text style={styles.infoTitle}>Память агента</Text>
            <Text style={styles.infoText}>Сохраняйте короткие факты о проекте, которые агент сможет найти только по вашей задаче. Записи принадлежат вашему аккаунту и не являются системными инструкциями.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/memory")} style={({ pressed }) => [styles.accessButton, pressed && styles.accessButtonPressed]}><Text style={styles.accessButtonText}>Управлять памятью</Text></Pressable>
          </Ai40Card>
        </View>

        <View>
          <SectionTitle title="Инфраструктура" />
          <Ai40Card style={styles.infoCard}>
            <StatusPill label="Server-side only" tone="ready" />
            <Text style={styles.infoTitle}>AI40 Gateway и Telegram</Text>
            <Text style={styles.infoText}>Проверьте режим вычислений и безопасную готовность Telegram Mini App. Ключи провайдеров и токен бота не попадают в приложение.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/infrastructure")} style={({ pressed }) => [styles.accessButton, pressed && styles.accessButtonPressed]}><Text style={styles.accessButtonText}>Открыть статус</Text></Pressable>
          </Ai40Card>
        </View>

        <View>
          <SectionTitle title="О приложении" />
          <Ai40Card style={styles.infoCard}>
            <StatusPill label="AI 4.0 Unified Assistant" tone="ready" />
            <Text style={styles.infoTitle}>Безопасная первая версия</Text>
            <Text style={styles.infoText}>ИИ отвечает через серверный шлюз. История и библиотека по умолчанию находятся на устройстве. Внешние GitHub-ссылки открываются только по вашему нажатию; код репозиториев не запускается.</Text>
          </Ai40Card>
        </View>

        <View>
          <SectionTitle title="Локальные данные" />
          <Ai40Card style={styles.dangerCard}><Text style={styles.infoTitle}>Очистка рабочего пространства</Text><Text style={styles.infoText}>Удаляет историю, настройки и локальные копии импортированных материалов. Не затрагивает исходные файлы за пределами приложения.</Text><PrimaryButton label="Очистить данные" icon="delete-outline" tone="danger" onPress={clearData} /></Ai40Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 16, paddingBottom: 26 },
  header: { gap: 9 }, lead: { color: palette.muted, fontSize: 13, lineHeight: 19 }, group: { paddingVertical: 6 },
  settingRow: { flexDirection: "row", gap: 14, alignItems: "center", paddingVertical: 12 }, settingCopy: { flex: 1, gap: 4 },
  settingTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" }, settingText: { color: palette.muted, fontSize: 12, lineHeight: 17 }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line },
  infoCard: { gap: 10 }, infoTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" }, infoText: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  accessButton: { minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: palette.indigo, paddingHorizontal: 14 }, accessButtonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] }, accessButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  dangerCard: { gap: 10, backgroundColor: "#FFF8F8", borderColor: "#F6D7D9" },
});
