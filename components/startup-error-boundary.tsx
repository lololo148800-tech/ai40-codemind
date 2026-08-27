import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Keeps a render-time exception from looking like a silent exit after the splash screen. */
export class StartupErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AI40 startup] render fallback", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>AI40 CODEMIND</Text>
          <Text style={styles.title}>Не удалось открыть экран</Text>
          <Text style={styles.text}>Данные и ключи не удалены. Нажмите «Повторить»; если экран снова не загрузится, перезапустите приложение.</Text>
          <Pressable accessibilityRole="button" onPress={() => this.setState({ hasError: false })} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Повторить</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#10121B" },
  card: { gap: 12, padding: 22, borderRadius: 22, backgroundColor: "#1B1E2B", borderWidth: 1, borderColor: "#30354A" },
  eyebrow: { color: "#46D6C6", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#FFFFFF", fontSize: 23, fontWeight: "900" },
  text: { color: "#C5CADB", fontSize: 14, lineHeight: 20 },
  button: { alignSelf: "flex-start", minHeight: 42, justifyContent: "center", paddingHorizontal: 15, borderRadius: 13, backgroundColor: "#5850EC" },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
