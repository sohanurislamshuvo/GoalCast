"use client";

import { useEffect, useState } from "react";
import { isLive, isUpcoming } from "@/lib/format";
import type { MatchesPayload, WcMatch } from "@/lib/types";
import MatchCard from "./MatchCard";

// Selection must be deterministic from the payload alone (no Date.now()) so
// server render and hydration agree.
function selectTickerMatches(matches: WcMatch[]): WcMatch[] {
  const sorted = [...matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const live = sorted.filter((m) => isLive(m.status));
  const upcoming = sorted.filter((m) => isUpcoming(m.status));
  return [...live, ...upcoming].slice(0, 8);
}

export default function LiveScoresTicker({ initial }: { initial: MatchesPayload }) {
  const [payload, setPayload] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) setPayload(await res.json());
      } catch {
        // Keep showing the last good payload.
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const matches = selectTickerMatches(payload.matches);
  if (!matches.length) return null;

  const liveCount = matches.filter((m) => isLive(m.status)).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
          {liveCount > 0 ? "Live & upcoming" : "Upcoming matches"}
        </h2>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-bold text-live">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
            {liveCount} LIVE
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}
