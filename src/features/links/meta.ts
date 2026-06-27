import { BookmarkType } from "@prisma/client";

export type BookmarkMeta = {
  type: BookmarkType;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  defaultTitle: string;
};

function youTubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return u.pathname.slice(1) || null;
  if (host.endsWith("youtube.com")) {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
  }
  return null;
}

// Derive type, favicon, and (for YouTube) a thumbnail purely from the URL —
// no outbound fetch, so no SSRF surface. Images are loaded client-side.
export function deriveBookmarkMeta(rawUrl: string): BookmarkMeta {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return {
      type: BookmarkType.LINK,
      faviconUrl: null,
      thumbnailUrl: null,
      defaultTitle: rawUrl,
    };
  }
  const host = u.hostname.replace(/^www\./, "");
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  const id = youTubeId(u);
  if (id) {
    return {
      type: BookmarkType.YOUTUBE,
      faviconUrl,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      defaultTitle: host,
    };
  }
  return { type: BookmarkType.LINK, faviconUrl, thumbnailUrl: null, defaultTitle: host };
}

export function hostnameOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}
