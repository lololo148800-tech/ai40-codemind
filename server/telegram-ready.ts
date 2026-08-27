import { createHmac, timingSafeEqual } from "crypto";

import type { Express, Request, Response } from "express";
import { z } from "zod";

import { ENV } from "./_core/env";

const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative(),
}).passthrough();

type TelegramSettings = {
  botToken: string;
  webhookSecret: string;
  publicUrl: string;
};

export type TelegramIntegrationStatus = {
  enabled: boolean;
  miniAppAuthReady: boolean;
  webhookPath: "/api/telegram/webhook";
  miniAppUrl: string | null;
  delivery: "not_configured" | "receive_only";
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function currentSettings(): TelegramSettings {
  return {
    botToken: ENV.telegramBotToken.trim(),
    webhookSecret: ENV.telegramWebhookSecret.trim(),
    publicUrl: ENV.appPublicUrl.trim().replace(/\/$/, ""),
  };
}

export function getTelegramIntegrationStatus(settings = currentSettings()): TelegramIntegrationStatus {
  const hasPublicHttpsUrl = /^https:\/\/[^\s/$.?#][^\s]*$/i.test(settings.publicUrl);
  return {
    enabled: Boolean(settings.botToken && settings.webhookSecret && hasPublicHttpsUrl),
    miniAppAuthReady: Boolean(settings.botToken),
    webhookPath: "/api/telegram/webhook",
    miniAppUrl: hasPublicHttpsUrl ? `${settings.publicUrl}/?source=telegram` : null,
    // Deliberately no message execution until an explicit approved worker is connected.
    delivery: settings.botToken && settings.webhookSecret && hasPublicHttpsUrl ? "receive_only" : "not_configured",
  };
}

export function verifyTelegramWebhookSecret(received: string | string[] | undefined, expected: string) {
  return typeof received === "string" && expected.length > 0 && safeEqual(received, expected);
}

export function verifyTelegramInitData(initData: string, botToken: string, nowSeconds = Math.floor(Date.now() / 1_000), maxAgeSeconds = 86_400) {
  if (!botToken || !initData || initData.length > 8_192) return { valid: false as const, reason: "invalid_input" as const };
  const parsed = new URLSearchParams(initData);
  const hash = parsed.get("hash");
  const authDate = Number(parsed.get("auth_date"));
  if (!hash || !Number.isInteger(authDate) || authDate <= 0 || nowSeconds - authDate > maxAgeSeconds || authDate > nowSeconds + 60) {
    return { valid: false as const, reason: "expired_or_malformed" as const };
  }
  const dataCheckString = [...parsed.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return safeEqual(hash, expected)
    ? { valid: true as const, reason: null }
    : { valid: false as const, reason: "invalid_signature" as const };
}

function respondWebhookError(res: Response, status: number, message: string) {
  return res.status(status).json({ ok: false, error: message });
}

/**
 * This endpoint is intentionally receive-only: it validates the Telegram
 * secret, accepts a standard Update, and does not run a shell, call an AI
 * model, forward data, or send a message. Attach a reviewed worker later.
 */
export function registerTelegramReadyRoutes(app: Express) {
  app.post("/api/telegram/webhook", (req: Request, res: Response) => {
    const settings = currentSettings();
    if (!getTelegramIntegrationStatus(settings).enabled) {
      return respondWebhookError(res, 503, "Telegram integration is not configured.");
    }
    if (!verifyTelegramWebhookSecret(req.headers["x-telegram-bot-api-secret-token"], settings.webhookSecret)) {
      return respondWebhookError(res, 401, "Webhook secret is invalid.");
    }
    const update = telegramUpdateSchema.safeParse(req.body);
    if (!update.success) return respondWebhookError(res, 400, "Telegram update is malformed.");
    return res.status(200).json({ ok: true, acceptedUpdateId: update.data.update_id, execution: "not_started" });
  });
}
