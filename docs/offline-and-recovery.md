# AI40 Offline-First and Recovery

AI40 is **offline-first for local workspace data**, not an offline copy of a frontier cloud model. Its local mode keeps messages, locally imported materials, explicit local settings and deterministic review/test-plan fallback on the device. It deliberately makes no server request while the Offline toggle is on.

| Capability | Without network | With network |
|---|---|---|
| Chat history and imported local materials | Available on the device | Available on the device |
| Code Review and Test Lab fallback | Deterministic checks of pasted text and a local next-step plan | Full server-side agent workflow can be requested |
| Multi-model analysis, public research, GitHub CI status, media generation | Not available | Available after the respective access and approval conditions are met |
| APK build | Not available | GitHub Actions debug workflow only after a manual dispatch |

The Express liveness endpoint `GET /api/health` returns only service health, timestamp and uptime. It has no keys, model configuration or user data. If the server request fails, the mobile client saves a local fallback message instead of silently discarding the user's task.

## Recovery boundaries

The managed service may restart or scale after inactivity. A health endpoint, persistent local workspace, retry-by-new-request behavior and GitHub CI evidence reduce the impact of a transient outage; they do **not** prove permanent uptime. A separate continuously reserved process can be enabled later only with approval for its usage-based cost. Production Android signing is also intentionally separate from debug APK generation.
