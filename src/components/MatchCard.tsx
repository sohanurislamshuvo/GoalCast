"use client";

import { humanizeGroup, humanizeStage, isLive, isUpcoming } from "@/lib/format";
import type { WcMatch, WcTeam } from "@/lib/types";
import { useMounted } from "./useMounted";

function TeamBadge({ team }: { team: WcTeam }) {
  if (team.crest) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.crest}
        alt=""
        loading="lazy"
        className="h-6 w-6 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[9px] font-bold text-muted">
      {(team.tla ?? team.name).slice(0, 3).toUpperCase()}
    </span>
  );
}

function StatusBadge({ match }: { match: WcMatch }) {
  const mounted = useMounted();

  if (isLive(match.status)) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-live">
        <span className="h-2 w-2 animate-pulse rounded-full bg-live" />
        LIVE
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return <span className="text-xs font-semibold text-muted">FT</span>;
  }
  if (isUpcoming(match.status)) {
    return (
      <span className="text-xs font-semibold text-pitch" suppressHydrationWarning>
        {mounted
          ? new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(match.utcDate))
          : "--:--"}
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-muted">
      {humanizeStage(match.status)}
    </span>
  );
}

export default function MatchCard({ match }: { match: WcMatch }) {
  const hasScore =
    match.score.fullTime.home !== null && match.score.fullTime.away !== null;
  const showScore = hasScore && !isUpcoming(match.status);

  return (
    <div className="flex min-w-60 flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] uppercase tracking-wider text-muted">
          {humanizeGroup(match.group) ?? humanizeStage(match.stage)}
        </span>
        <StatusBadge match={match} />
      </div>
      {[
        { team: match.homeTeam, goals: match.score.fullTime.home },
        { team: match.awayTeam, goals: match.score.fullTime.away },
      ].map(({ team, goals }, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge team={team} />
            <span className="truncate text-sm font-medium">{team.name}</span>
          </div>
          <span className="text-sm font-bold tabular-nums">
            {showScore ? goals : isLive(match.status) ? "–" : ""}
          </span>
        </div>
      ))}
      {match.venue && (
        <p className="truncate text-[11px] text-muted">📍 {match.venue}</p>
      )}
    </div>
  );
}
