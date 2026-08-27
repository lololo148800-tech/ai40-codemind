const PRIVATE_HOSTS = /^(?:localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[?::1\]?|fc|fd|fe80)/i;

export type PublicWebsiteBrief = {
  url: string;
  title: string | null;
  description: string | null;
  language: string | null;
  headings: string[];
  contentType: string | null;
  bytesRead: number;
  access: "public_read_only";
  boundary: string;
};

function safeText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280);
}

function extractFirst(pattern: RegExp, html: string) {
  const match = html.match(pattern);
  return match?.[1] ? safeText(match[1]) || null : null;
}

export function assertSafePublicHttpsUrl(rawUrl: string) {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { throw new Error("Укажите полный публичный HTTPS URL, например https://example.com."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || PRIVATE_HOSTS.test(url.hostname)) throw new Error("Разрешены только публичные HTTPS-сайты без порта, логина и пароля.");
  return url;
}

/** Retrieves bounded public HTML only; scripts, form posts, authenticated sessions and redirects are excluded. */
export async function inspectPublicWebsite(rawUrl: string): Promise<PublicWebsiteBrief> {
  const url = assertSafePublicHttpsUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { method: "GET", redirect: "manual", headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "AI40-CodeMind/public-site-brief" }, signal: controller.signal });
    if (response.status >= 300 && response.status < 400) throw new Error("Сайт перенаправляет на другой адрес. Откройте конечный публичный HTTPS URL явно.");
    if (!response.ok) throw new Error(`Сайт вернул HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("text/html")) throw new Error("Разрешён только публичный HTML-документ.");
    const text = (await response.text()).slice(0, 300_000);
    const headings = [...text.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => safeText(match[1])).filter(Boolean).slice(0, 3);
    return {
      url: url.toString(),
      title: extractFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, text),
      description: extractFirst(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i, text) ?? extractFirst(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i, text),
      language: extractFirst(/<html[^>]+lang=["']([^"']+)["']/i, text),
      headings,
      contentType,
      bytesRead: new TextEncoder().encode(text).length,
      access: "public_read_only",
      boundary: "AI40 прочитал ограниченный объём публичного HTML. Он не вошёл в аккаунт, не запускал JavaScript, не отправлял формы и не изменял сайт.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
