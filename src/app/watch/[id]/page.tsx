import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChannelCard from "@/components/ChannelCard";
import VideoPlayer from "@/components/player/VideoPlayer";
import { getAllChannels, getChannelById, getCuratedChannels } from "@/lib/channels";
import { countryFlag } from "@/lib/format";

export const dynamic = "force-static";
export const revalidate = 3600;
// Curated channels are prebuilt; iptv-org ids render on demand via ISR.
export const dynamicParams = true;

export function generateStaticParams() {
  return getCuratedChannels().map((c) => ({ id: c.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const channel = await getChannelById(decodeURIComponent(id));
  return { title: channel ? `${channel.name} — GoalCast` : "Channel — GoalCast" };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const channel = await getChannelById(decodeURIComponent(id));
  if (!channel || channel.streams.length === 0) notFound();

  const more = (await getAllChannels())
    .filter((c) => c.id !== channel.id)
    .slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <VideoPlayer streams={channel.streams} channelName={channel.name} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{channel.name}</h1>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            {countryFlag(channel.country)} {channel.country ?? "Worldwide"}
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            {channel.source === "curated" ? "My channels" : "Public stream"}
          </span>
        </div>
        {channel.description && (
          <p className="max-w-2xl text-sm text-muted">{channel.description}</p>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
          More channels
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {more.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
