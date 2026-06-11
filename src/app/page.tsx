import Link from "next/link";
import ChannelCard from "@/components/ChannelCard";
import LiveScoresTicker from "@/components/LiveScoresTicker";
import { getAllChannels } from "@/lib/channels";
import { getWorldCupMatches } from "@/lib/worldcup";

// force-static keeps the page ISR-cached even though the iptv-org fetches
// inside are uncached (they exceed the Data Cache entry limit).
export const dynamic = "force-static";
export const revalidate = 300;

export default async function HomePage() {
  const [channels, matches] = await Promise.all([
    getAllChannels(),
    getWorldCupMatches(),
  ]);

  const featured = [
    ...channels.filter((c) => c.featured),
    ...channels.filter((c) => !c.featured),
  ].slice(0, 8);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 via-surface to-background p-8 sm:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pitch/10 blur-3xl"
          aria-hidden
        />
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-pitch">
          ⚽ FIFA World Cup 2026 · 11 June – 19 July
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Every match. Every channel.{" "}
          <span className="text-pitch">One screen.</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Live sports channels and the full World Cup 2026 schedule with live
          scores — add your own streams or browse free public channels.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/channels"
            className="rounded-full bg-pitch px-6 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105"
          >
            ▶ Watch live TV
          </Link>
          <Link
            href="/schedule"
            className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-bold transition-colors hover:border-pitch"
          >
            Match schedule
          </Link>
        </div>
      </section>

      <LiveScoresTicker initial={matches} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
            Featured channels
          </h2>
          <Link href="/channels" className="text-sm font-medium text-pitch hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {featured.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
