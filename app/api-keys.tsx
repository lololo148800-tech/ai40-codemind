import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const AVAILABLE_SCOPES = ["chat:complete", "models:read", "agent:run", "worker:plan"] as const;
type ApiKeyScope = (typeof AVAILABLE_SCOPES)[number];

export default function ApiKeysScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [name, setName] = useState("Мой coding client");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [scopes, setScopes] = useState<ApiKeyScope[]>([...AVAILABLE_SCOPES]);
  const [error, setError] = useState("");
  const keys = trpc.apiKeys.list.useQuery(undefined, { enabled: isAuthenticated });
  const issue = trpc.apiKeys.issue.useMutation({ onSuccess: () => { void keys.refetch(); } });
  const revoke = trpc.apiKeys.revoke.useMutation({ onSuccess: () => { void keys.refetch(); } });

  const create = async () => {
    setError("");
    try {
      const result = await issue.mutateAsync({ name: name.trim(), scopes });
      setRevealedKey(result.secret);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Не удалось создать API-ключ.");
    }
  };

  const toggleScope = (scope: ApiKeyScope) => {
    setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  };

  const requestRevoke = (keyId: number, label: string) => {
    Alert.alert("Отозвать ключ?", `Ключ «${label}» больше не сможет обращаться к многоагентной панели. Это действие нельзя отменить.`, [
      { text: "Отмена", style: "cancel" },
      { text: "Отозвать", style: "destructive", onPress: () => { void revoke.mutateAsync({ keyId }).catch((value) => setError(value instanceof Error ? value.message : "Не удалось отозвать ключ.")); } },
    ]);
  };

  if (loading) return <ScreenContainer className="items-center justify-center" edges={["top", "bottom", "left", "right"]}><ActivityIndicator color={palette.indigo} /></ScreenContainer>;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow="AI40 ACCESS" title="API-ключи" action={<IconAction icon="close" label="Закрыть ключи" onPress={() => router.back()} />} />
        <Ai40Card style={styles.notice}><StatusPill label="One-time reveal" tone="warning" /><Text style={styles.title}>Ключ отображается один раз</Text><Text style={styles.copy}>Сервер хранит только HMAC-хеш. Сохраните показанный ключ в менеджере секретов; не отправляйте его в чат, репозиторий, скриншоты или мобильный клиент.</Text></Ai40Card>
        {!isAuthenticated ? (
          <Ai40Card style={styles.blocked}><StatusPill label="Нужен проектный сеанс" tone="blocked" /><Text style={styles.title}>Выпуск ключей требует входа</Text><Text style={styles.copy}>Это защищает выпуск и отзыв ключей. После входа в проект вернитесь на этот экран.</Text><Pressable accessibilityRole="button" onPress={() => { void startOAuthLogin(); }} style={({ pressed }) => [styles.login, pressed && { opacity: 0.8 }]}><Text style={styles.loginText}>Войти в проект</Text></Pressable></Ai40Card>
        ) : <>
          <View style={styles.section}>
            <SectionTitle title="Новый ключ" />
            <Ai40Card style={styles.card}>
              <Text style={styles.label}>Название</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} maxLength={80} placeholder="Например, CI coding review" placeholderTextColor="#7886A8" editable={!issue.isPending} returnKeyType="done" />
              <Text style={styles.label}>Scopes</Text>
              <View style={styles.scopeRow}>{AVAILABLE_SCOPES.map((scope) => <Pressable key={scope} accessibilityRole="checkbox" accessibilityState={{ checked: scopes.includes(scope) }} onPress={() => toggleScope(scope)} style={({ pressed }) => [styles.scopeChip, scopes.includes(scope) && styles.scopeChipActive, pressed && { opacity: 0.75 }]}><Text style={[styles.scopeText, scopes.includes(scope) && styles.scopeTextActive]}>{scope}</Text></Pressable>)}</View>
              <Text style={styles.copy}>Ключ не даёт shell-доступ, запись файлов или APK-сборку. `worker:plan` разрешает только получить approval-план будущего worker.</Text>
              <PrimaryButton label={issue.isPending ? "Создаю ключ…" : "Создать API-ключ"} icon="vpn-key" onPress={() => { void create(); }} disabled={issue.isPending || name.trim().length < 2 || !scopes.length} />
            </Ai40Card>
          </View>
          {revealedKey ? <Ai40Card style={styles.reveal}><StatusPill label="Сохраните сейчас" tone="warning" /><Text selectable style={styles.secret}>{revealedKey}</Text><Text style={styles.copy}>После закрытия этого блока секрет не будет доступен снова. В списке остаются только имя и короткий префикс.</Text><Pressable accessibilityRole="button" onPress={() => setRevealedKey(null)} style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.75 }]}><Text style={styles.dismissText}>Я сохранил ключ</Text></Pressable></Ai40Card> : null}
          <View style={styles.section}>
            <SectionTitle title="Выданные ключи" caption={keys.isLoading ? "Загрузка…" : `${keys.data?.length ?? 0}`} />
            {keys.data?.length ? keys.data.map((key) => <Ai40Card style={styles.keyCard} key={key.id}><View style={styles.keyHeader}><View style={styles.keyCopy}><Text style={styles.keyName}>{key.name}</Text><Text style={styles.keyPrefix}>{key.prefix}••••••••</Text></View><StatusPill label={key.revokedAt ? "Отозван" : "Активен"} tone={key.revokedAt ? "blocked" : "ready"} /></View><Text style={styles.copy}>Scopes: {key.scopes.join(", ") || "не указаны"}</Text><Text style={styles.copy}>Создан: {new Date(key.createdAt).toLocaleString("ru-RU")}{key.lastUsedAt ? ` · Использован: ${new Date(key.lastUsedAt).toLocaleString("ru-RU")}` : " · Ещё не использовался"}</Text>{!key.revokedAt ? <Pressable accessibilityRole="button" onPress={() => requestRevoke(key.id, key.name)} style={({ pressed }) => [styles.revoke, pressed && { opacity: 0.75 }]}><Text style={styles.revokeText}>Отозвать ключ</Text></Pressable> : null}</Ai40Card>) : <Ai40Card style={styles.card}><Text style={styles.copy}>Пока нет ключей. Создайте отдельный ключ для CI, desktop-клиента или другого доверенного сервиса.</Text></Ai40Card>}
          </View>
        </>}
        {error ? <Ai40Card style={styles.error}><Text style={styles.errorText}>{error}</Text></Ai40Card> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 16, paddingBottom: 28 }, notice: { gap: 8, backgroundColor: "#FFFBEB", borderColor: "#F6E6B6" }, blocked: { gap: 8, backgroundColor: "#FFF8F8", borderColor: "#F6D7D9" }, section: { gap: 8 }, card: { gap: 10 }, title: { color: palette.ink, fontSize: 15, fontWeight: "800" }, copy: { color: palette.muted, fontSize: 12, lineHeight: 18 }, label: { color: palette.ink, fontSize: 13, fontWeight: "800" }, input: { minHeight: 46, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: "#FFFFFF", color: palette.ink, fontSize: 13, paddingHorizontal: 12 }, scopeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, scopeChip: { minHeight: 32, justifyContent: "center", paddingHorizontal: 9, borderRadius: 10, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF" }, scopeChipActive: { borderColor: palette.indigo, backgroundColor: "#EEECFF" }, scopeText: { color: palette.muted, fontSize: 10, fontWeight: "800" }, scopeTextActive: { color: palette.indigo }, reveal: { gap: 10, backgroundColor: "#F1FAF8", borderColor: "#CDEBE5" }, secret: { color: palette.ink, fontFamily: "monospace", fontSize: 12, lineHeight: 18, backgroundColor: "#FFFFFF", borderRadius: 10, padding: 10 }, dismiss: { minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: palette.indigo, alignItems: "center", justifyContent: "center" }, dismissText: { color: palette.indigo, fontSize: 13, fontWeight: "800" }, keyCard: { gap: 9 }, keyHeader: { flexDirection: "row", gap: 10, justifyContent: "space-between", alignItems: "center" }, keyCopy: { flex: 1, gap: 2 }, keyName: { color: palette.ink, fontSize: 14, fontWeight: "800" }, keyPrefix: { color: palette.muted, fontSize: 11, fontFamily: "monospace" }, revoke: { minHeight: 38, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#FFF2F2" }, revokeText: { color: palette.danger, fontSize: 12, fontWeight: "800" }, login: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: palette.indigo }, loginText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, error: { backgroundColor: "#FFF4F4", borderColor: "#F3CECE" }, errorText: { color: palette.danger, fontSize: 13, lineHeight: 18 },
});
