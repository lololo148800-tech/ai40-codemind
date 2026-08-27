export const MAX_LINK_DEPTH = 3;
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const MAX_LINK_PAGES = 8;
export const MAX_LINKS_PER_PAGE = 12;

export type LinkSource = "github" | "google" | "manus" | "website";
export type LinkAccess = "public_read_only" | "requires_browser" | "blocked" | "unavailable";

export type LinkTrailNode = {
  url: string;
  source: LinkSource;
  access: LinkAccess;
  depth: number;
  title: string | null;
  excerpt: string | null;
  outgoingLinks: string[];
  boundary: string;
};

export type LinkTrail = {
  startUrl: string;
  requestedDepth: number;
  visitedCount: number;
  nodes: LinkTrailNode[];
  boundary: string;
};

const PRIVATE_OR_NONPUBLIC_HOST = /^(?:localhost|.+\.localhost|.+\.local|.+\.internal|.+\.test|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|::1)$/i;

function isPrivateIp(address: string) {
  if (address === "::1" || /^f[cd][0-9a-f:]*$/i.test(address) || /^fe[89ab][0-9a-f:]*$/i.test(address)) return true;
  const ipv4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = ipv4.slice(1).map(Number);
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31;
}

function text(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function titleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? text(match[1]).slice(0, 180) || null : null;
}

function excerptFromHtml(html: string) {
  const match = html.match(/<meta[^>]+(?:name=["']description["'][^>]+content=["']([^"']*)["']|content=["']([^"']*)["'][^>]+name=["']description["'])[^>]*>/i);
  return text(match?.[1] ?? match?.[2] ?? html.replace(/<script[\s\S]*?<\/script>/gi, "")).slice(0, 320) || null;
}

export function classifyLinkSource(url: URL): LinkSource {
  const host = url.hostname.toLowerCase();
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  if (host === "google.com" || host.endsWith(".google.com")) return "google";
  if (host === "manus.im" || host.endsWith(".manus.im")) return "manus";
  return "website";
}

/** Allows only canonical public HTTPS targets. DNS, ports, credentials and private-network hostnames are rejected. */
export function assertSafePublicLinkUrl(rawUrl: string): URL {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { throw new Error("Укажите полный публичный HTTPS URL, например https://example.com."); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (url.protocol !== "https:" || url.username || url.password || url.port || PRIVATE_OR_NONPUBLIC_HOST.test(host)) {
    throw new Error("Разрешены только публичные HTTPS URL без порта, логина, пароля и внутреннего адреса.");
  }
  url.hash = "";
  return url;
}

export function linkAccessFor(url: URL): { source: LinkSource; access: LinkAccess; boundary: string } {
  const source = classifyLinkSource(url);
  if (source === "google") return { source, access: "requires_browser", boundary: "Google-страницы могут требовать JavaScript, согласие или защиту от ботов. AI40 не обходит эти ограничения; используйте разрешённый браузер или официальный data connector." };
  if (source === "manus") return { source, access: "requires_browser", boundary: "Manus-ссылки могут быть личными или требовать активный сеанс. AI40 не использует чужую сессию и не обходит вход." };
  return { source, access: "public_read_only", boundary: "AI40 читает только ограниченный публичный HTML: без cookies, входа, JavaScript, форм и изменений сайта." };
}

async function assertPublicDns(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("private-ip");
    return;
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error("private-dns");
}

export function extractSafeOutgoingLinks(html: string, baseUrl: URL) {
  const links: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = assertSafePublicLinkUrl(new URL(match[1], baseUrl).toString());
      const candidate = url.toString();
      if (!seen.has(candidate) && candidate !== baseUrl.toString()) {
        seen.add(candidate);
        links.push(candidate);
      }
    } catch { /* Ignore unsafe, non-HTTPS and malformed anchors. */ }
    if (links.length >= MAX_LINKS_PER_PAGE) break;
  }
  return links;
}

async function fetchPublicNode(url: URL, depth: number): Promise<LinkTrailNode> {
  const descriptor = linkAccessFor(url);
  if (descriptor.access !== "public_read_only") {
    return { url: url.toString(), depth, ...descriptor, title: null, excerpt: null, outgoingLinks: [] };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    await assertPublicDns(url);
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "AI40-CodeMind/link-explorer" },
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) throw new Error("redirect");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) throw new Error("not-html");
    const html = (await response.text()).slice(0, 250_000);
    return {
      url: url.toString(),
      source: descriptor.source,
      access: "public_read_only",
      depth,
      title: titleFromHtml(html),
      excerpt: excerptFromHtml(html),
      outgoingLinks: extractSafeOutgoingLinks(html, url),
      boundary: descriptor.boundary,
    };
  } catch (error) {
    const reason = error instanceof Error && error.message === "redirect" ? "Сайт перенаправляет на другой адрес; добавьте конечный HTTPS URL явно." : "Публичная страница недоступна или не поддерживает ограниченное HTML-чтение.";
    return { url: url.toString(), source: descriptor.source, access: "unavailable", depth, title: null, excerpt: null, outgoingLinks: [], boundary: reason };
  } finally {
    clearTimeout(timeout);
  }
}

/** Crawls a small, user-initiated URL trail. It never authenticates, runs scripts, posts data, or follows redirects. */
export async function explorePublicLinkTrail(rawStartUrl: string, requestedDepth: number): Promise<LinkTrail> {
  const start = assertSafePublicLinkUrl(rawStartUrl);
  const maxDepth = Math.min(Math.max(Math.floor(requestedDepth), 0), MAX_LINK_DEPTH);
  const queue: Array<{ url: URL; depth: number }> = [{ url: start, depth: 0 }];
  const queued = new Set([start.toString()]);
  const nodes: LinkTrailNode[] = [];

  while (queue.length && nodes.length < MAX_LINK_PAGES) {
    const current = queue.shift()!;
    const node = await fetchPublicNode(current.url, current.depth);
    nodes.push(node);
    if (node.access !== "public_read_only" || current.depth >= maxDepth) continue;
    for (const rawUrl of node.outgoingLinks) {
      if (queued.size >= MAX_LINK_PAGES) break;
      const next = assertSafePublicLinkUrl(rawUrl);
      if (queued.has(next.toString())) continue;
      queued.add(next.toString());
      queue.push({ url: next, depth: current.depth + 1 });
    }
  }
  return {
    startUrl: start.toString(),
    requestedDepth: maxDepth,
    visitedCount: nodes.length,
    nodes,
    boundary: `Цепочка ограничена ${MAX_LINK_PAGES} страницами, глубиной ${MAX_LINK_DEPTH}, публичным HTTPS HTML и явным запуском пользователя. AI40 не обходит вход, CAPTCHA, robots, paywall или private-network адреса.`,
  };
}
