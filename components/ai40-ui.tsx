import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

export const palette = {
  ink: "#151726",
  paper: "#F7F7FB",
  surface: "#FFFFFF",
  indigo: "#4F46E5",
  indigoSoft: "#EEF0FF",
  teal: "#14B8A6",
  muted: "#6B7085",
  line: "#E5E7F0",
  success: "#0F9E88",
  warning: "#C87900",
  danger: "#C93636",
  navy: "#151A37",
};

export function Ai40Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  tone = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  tone?: "primary" | "soft" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const paletteByTone = {
    primary: { backgroundColor: palette.indigo, color: "#FFFFFF" },
    soft: { backgroundColor: palette.indigoSoft, color: palette.indigo },
    danger: { backgroundColor: "#FFEDEE", color: palette.danger },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: paletteByTone.backgroundColor },
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={18} color={paletteByTone.color} /> : null}
      <Text style={[styles.buttonText, { color: paletteByTone.color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconAction({
  icon,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}
    >
      <MaterialIcons name={icon} size={21} color={palette.ink} />
    </Pressable>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "ready" | "warning" | "blocked" }) {
  const colors = {
    neutral: { backgroundColor: "#EEF0F6", color: palette.muted },
    ready: { backgroundColor: "#E5F7F3", color: palette.success },
    warning: { backgroundColor: "#FFF3DB", color: palette.warning },
    blocked: { backgroundColor: "#FFEDEE", color: palette.danger },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.pillText, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

export function MutedText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titleCopy: { flex: 1, gap: 2 },
  eyebrow: { color: palette.teal, fontWeight: "800", fontSize: 10, letterSpacing: 1.2 },
  title: { color: palette.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.5 },
  sectionTitleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 },
  sectionTitle: { color: palette.ink, fontWeight: "800", fontSize: 16 },
  sectionCaption: { color: palette.muted, fontSize: 12 },
  button: { minHeight: 46, paddingHorizontal: 15, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  buttonPressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontWeight: "800", fontSize: 14 },
  iconAction: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  iconActionPressed: { opacity: 0.65 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: "800" },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 19 },
});
