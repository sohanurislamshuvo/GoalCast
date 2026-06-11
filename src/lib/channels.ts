import curated from "../../data/channels.json";
import { getSportsChannels } from "./iptv";
import type { StreamSource, TvChannel } from "./types";

type CuratedJson = {
  channels: Array<{
    id: string;
    name: string;
    featured?: boolean;
    country?: string | null;
    logo?: string | null;
    description?: string;
    streams: StreamSource[];
  }>;
};

export function getCuratedChannels(): TvChannel[] {
  return (curated as CuratedJson).channels.map((c) => ({
    id: c.id,
    name: c.name,
    logo: c.logo ?? null,
    country: c.country ?? null,
    source: "curated",
    featured: c.featured ?? false,
    description: c.description,
    streams: c.streams,
  }));
}

export async function getAllChannels(): Promise<TvChannel[]> {
  const curatedList = getCuratedChannels();
  const iptv = await getSportsChannels();
  const curatedIds = new Set(curatedList.map((c) => c.id));
  return [...curatedList, ...iptv.filter((c) => !curatedIds.has(c.id))];
}

export async function getChannelById(id: string): Promise<TvChannel | null> {
  const curatedMatch = getCuratedChannels().find((c) => c.id === id);
  if (curatedMatch) return curatedMatch;
  const iptv = await getSportsChannels();
  return iptv.find((c) => c.id === id) ?? null;
}
