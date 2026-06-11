import fallbackFixtures from "../../data/fixtures-fallback.json";
import type { MatchesPayload, MatchStatus, WcMatch } from "./types";

const API_URL = "https://api.football-data.org/v4/competitions/WC/matches";
// Rough upper bound for a match still being in progress after kickoff.
const MATCH_WINDOW_MS = 2.5 * 60 * 60 * 1000;

type ApiMatch = {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null;
  venue?: string | null;
  homeTeam: { name: string | null; tla: string | null; crest: string | null };
  awayTeam: { name: string | null; tla: string | null; crest: string | null };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
};

function normalizeApiMatch(m: ApiMatch): WcMatch {
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    matchday: m.matchday ?? null,
    stage: m.stage,
    group: m.group ?? null,
    venue: m.venue ?? null,
    homeTeam: {
      name: m.homeTeam?.name ?? "TBD",
      tla: m.homeTeam?.tla ?? null,
      crest: m.homeTeam?.crest ?? null,
    },
    awayTeam: {
      name: m.awayTeam?.name ?? "TBD",
      tla: m.awayTeam?.tla ?? null,
      crest: m.awayTeam?.crest ?? null,
    },
    score: {
      winner: m.score?.winner ?? null,
      fullTime: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
    },
  };
}

// The static file has no live data, so statuses are recomputed from kickoff
// time on every request: past → FINISHED, in window → IN_PLAY, else TIMED.
function fallbackPayload(): MatchesPayload {
  const now = Date.now();
  const matches = (fallbackFixtures as unknown as WcMatch[]).map((m) => {
    const kickoff = Date.parse(m.utcDate);
    let status: MatchStatus = "TIMED";
    if (now > kickoff + MATCH_WINDOW_MS) status = "FINISHED";
    else if (now >= kickoff) status = "IN_PLAY";
    return { ...m, status };
  });
  return {
    source: "fallback",
    lastUpdated: new Date().toISOString(),
    matches,
  };
}

export async function getWorldCupMatches(): Promise<MatchesPayload> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return fallbackPayload();
  try {
    // Small payload (<2 MB), so the Data Cache applies: at most ~1 upstream
    // call per minute sitewide — well under the free tier's 10 req/min.
    const res = await fetch(API_URL, {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`football-data.org responded ${res.status}`);
    const data: { matches?: ApiMatch[] } = await res.json();
    return {
      source: "api",
      lastUpdated: new Date().toISOString(),
      matches: (data.matches ?? []).map(normalizeApiMatch),
    };
  } catch (error) {
    console.error("football-data.org fetch failed, using static fixtures:", error);
    return fallbackPayload();
  }
}
