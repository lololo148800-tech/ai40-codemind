import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Ai40Card, IconAction, palette, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function InfrastructureScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const status = trpc.infrastructure.status.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const inferenceLabel = status.data?.inference.mode === "self_hosted" ? "Self-hosted inference" : "Managed inference";
  const telegram = status.data?.telegram;

  return (
    <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenTitle eyebrow="AI40 CONTROL PLANE" title="Инфраструктура" action={<IconAction icon="close" label="Закрыть" onPress={() => router.back()} />} />
          <Text style={styles.lead}>Статус не показывает адреса, ключи или токены. Он нужен только для безопасной проверки подключения.</Text>
        </View>

        {!isAuthenticated ? (
          <Ai40Card style={styles.card}>
            <StatusPill label="Нужен вход" tone="warning" />
            <Text style={styles.title}>Приватный статус проекта</Text>
            <Text style={styles.text}>Войдите через экран ключей доступа, чтобы увидеть, какой режим включён на сервере.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/api-keys")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Перейти к входу</Text></Pressable>
          </Ai40Card>
        ) : status.isLoading ? (
          <View style={styles.loading}><ActivityIndicator color={palette.indigo} /><Text style={styles.text}>Проверяем конфигурацию…</Text></View>
        ) : status.isError ? (
          <Ai40Card style={styles.card}><StatusPill label="Недоступно" tone="warning" /><Text style={styles.title}>Статус временно не получен</Text><Text style={styles.text}>Проверьте соединение и повторите позже. Секреты по-прежнему не будут показаны.</Text></Ai40Card>
        ) : (
          <>
            <View><SectionTitle title="Вычисления" /><Ai40Card style={styles.card}><StatusPill label={inferenceLabel} tone="ready" /><Text style={styles.title}>{status.data?.inference.mode === "self_hosted" ? "Свой совместимый AI endpoint" : "Управляемый AI40 runtime"}</Text><Text style={styles.text}>Мобильный клиент не хранит ключ провайдера. Для внешнего Python-клиента используется только отдельный AI40 API-ключ с нужными scopes.</Text></Ai40Card></View>
            <View><SectionTitle title="Telegram Mini App" /><Ai40Card style={styles.card}><StatusPill label={telegram?.enabled ? "Webhook готов" : "Не настроен"} tone={telegram?.enabled ? "ready" : "warning"} /><Text style={styles.title}>{telegram?.enabled ? "Приём обновлений включён" : "Telegram пока не подключён"}</Text><Text style={styles.text}>{telegram?.enabled ? "Webhook проверяет секрет, принимает обновление и не запускает команды или ИИ без отдельного одобренного worker-а." : "Для включения нужны серверные TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и HTTPS APP_PUBLIC_URL. Они не вводятся в приложение."}</Text>{telegram?.miniAppUrl ? <Text style={styles.muted}>Mini App URL подготовлен на сервере.</Text> : null}</Ai40Card></View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 16, paddingBottom: 30 }, header: { gap: 9 }, lead: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  card: { gap: 10 }, title: { color: palette.ink, fontSize: 15, fontWeight: "800" }, text: { color: palette.muted, fontSize: 13, lineHeight: 19 }, muted: { color: palette.indigo, fontSize: 12, fontWeight: "700" },
  loading: { minHeight: 100, justifyContent: "center", alignItems: "center", gap: 12 }, button: { minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: palette.indigo, paddingHorizontal: 14 }, pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] }, buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
