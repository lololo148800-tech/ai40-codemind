export type HealthSnapshot = {
  ok: true;
  service: "AI40 CodeMind";
  timestamp: string;
  uptimeSeconds: number;
  mode: "managed";
  boundaries: string[];
};

/** Minimal unauthenticated liveness payload. Deliberately exposes neither env, keys, user data nor model configuration. */
export function buildHealthSnapshot(now = new Date(), uptimeSeconds = process.uptime()): HealthSnapshot {
  return {
    ok: true,
    service: "AI40 CodeMind",
    timestamp: now.toISOString(),
    uptimeSeconds: Math.max(0, Math.floor(uptimeSeconds)),
    mode: "managed",
    boundaries: ["health-only", "no-secrets", "no-user-data"],
  };
}
