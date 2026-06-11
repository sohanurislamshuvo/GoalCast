"use client";

import { useEffect, useMemo, useState } from "react";
import { humanizeGroup } from "@/lib/format";
import type { MatchesPayload, WcMatch } from "@/lib/types";
import MatchCard from "./MatchCard";
import { useMounted } from "./useMounted";

type StageFilter = "all" | "group" | "knockout";

export default function ScheduleView({ initial }: { initial: MatchesPayload }) {
  const [payload, setPayload] = useState(initial);
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const mounted = useMounted();

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

  const groups = useMemo(
    () =>
      [...new Set(payload.matches.map((m) => m.group).filter(Boolean))].sort() as string[],
    [payload.matches]
  );

  const filtered = useMemo(() => {
    return payload.matches.filter((m) => {
      if (stageFilter === "group" && m.stage !== "GROUP_STAGE") return false;
      if (stageFilter === "knockout" && m.stage === "GROUP_STAGE") return false;
      if (groupFilter !== "all" && m.group !== groupFilter) return false;
      return true;
    });
  }, [payload.matches, stageFilter, groupFilter]);

  // Grouping by the viewer's local date — only safe after mount.
  const byDate = useMemo(() => {
    if (!mounted) return [];
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const map = new Map<string, WcMatch[]>();
    for (const m of [...filtered].sort((a, b) => a.utcDate.localeCompare(b.utcDate))) {
      const key = fmt.format(new Date(m.utcDate));
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered, mounted]);

  return (
    <div className="space-y-6">
      {payload.source === "fallback" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Live scores unavailable — showing the static schedule. Add a free{" "}
          <code className="rounded bg-black/30 px-1">FOOTBALL_DATA_API_KEY</code>{" "}
          to enable live scores.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {(
            [
              ["all", "All"],
              ["group", "Group stage"],
              ["knockout", "Knockouts"],
            ] as [StageFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStageFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                stageFilter === value
                  ? "bg-pitch text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {stageFilter !== "knockout" && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground"
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {humanizeGroup(g)}
              </option>
            ))}
          </select>
        )}
      </div>

      {!mounted ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : byDate.length === 0 ? (
        <p className="py-12 text-center text-muted">No matches found.</p>
      ) : (
        byDate.map(([date, matches]) => (
          <section key={date} className="space-y-3">
            <h2 className="sticky top-14 z-10 -mx-1 bg-background/90 px-1 py-2 text-sm font-bold uppercase tracking-widest text-pitch backdrop-blur">
              {date}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
