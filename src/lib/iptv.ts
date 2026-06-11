import { cache } from "react";
import type { StreamSource, TvChannel } from "./types";

const API = "https://iptv-org.github.io/api";

type IptvChannel = {
  id: string;
  name: string;
  country: string | null;
  categories: string[] | null;
  is_nsfw: boolean;
  closed: string | null;
  replaced_by: string | null;
};

type IptvStream = {
  channel: string | null;
  feed: string | null;
  title: string | null;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
};

type IptvLogo = {
  channel: string;
  feed: string | null;
  url: string;
  format: string | null;
};

// These upstream files are several MB each — far over the Vercel Data Cache
// 2 MB per-entry limit — so we fetch them uncached and rely on ISR caching of
// the route/page output instead.
async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`iptv-org ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

// cache() dedupes the heavy download when several callers need the list
// within a single render pass (e.g. the watch page).
export const getSportsChannels = cache(async (): Promise<TvChannel[]> => {
  try {
    const [channels, streams, logos] = await Promise.all([
      fetchJson<IptvChannel[]>("channels.json"),
      fetchJson<IptvStream[]>("streams.json"),
      fetchJson<IptvLogo[]>("logos.json"),
    ]);

    const streamsByChannel = new Map<string, StreamSource[]>();
    for (const s of streams) {
      // https-only (mixed content is blocked on an https deployment) and no
      // custom header requirements (hls.js cannot send Referer/User-Agent).
      if (!s.channel || !s.url?.startsWith("https://")) continue;
      if (s.referrer || s.user_agent) continue;
      const list = streamsByChannel.get(s.channel) ?? [];
      list.push({ url: s.url, quality: s.quality, label: s.title });
      streamsByChannel.set(s.channel, list);
    }

    const logoByChannel = new Map<string, string>();
    for (const l of logos) {
      if (l.feed || logoByChannel.has(l.channel)) continue;
      if (!l.url?.startsWith("https://")) continue;
      logoByChannel.set(l.channel, l.url);
    }

    return channels
      .filter(
        (c) =>
          c.categories?.includes("sports") &&
          !c.is_nsfw &&
          !c.closed &&
          streamsByChannel.has(c.id)
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        logo: logoByChannel.get(c.id) ?? null,
        country: c.country,
        source: "iptv-org" as const,
        streams: streamsByChannel.get(c.id)!,
      }))
      .sort(
        (a, b) =>
          (a.country ?? "ZZ").localeCompare(b.country ?? "ZZ") ||
          a.name.localeCompare(b.name)
      );
  } catch (error) {
    // Never take the site down because the public index is unreachable —
    // curated channels still work.
    console.error("iptv-org fetch failed:", error);
    return [];
  }
});
