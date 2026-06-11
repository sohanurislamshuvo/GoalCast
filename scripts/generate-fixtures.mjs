// Downloads the openfootball World Cup 2026 schedule (public domain) and
// converts it into the normalized shape used by src/lib/worldcup.ts.
//
// Run manually whenever you want to refresh the static fallback fixtures:
//   node scripts/generate-fixtures.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const OUT = path.join(import.meta.dirname, "..", "data", "fixtures-fallback.json");

const STAGE_BY_ROUND = [
  [/^matchday/i, "GROUP_STAGE"],
  [/^round of 32/i, "LAST_32"],
  [/^round of 16/i, "LAST_16"],
  [/^quarter/i, "QUARTER_FINALS"],
  [/^semi/i, "SEMI_FINALS"],
  [/third/i, "THIRD_PLACE"],
  [/^final/i, "FINAL"],
];

function toStage(round) {
  for (const [re, stage] of STAGE_BY_ROUND) if (re.test(round ?? "")) return stage;
  return "GROUP_STAGE";
}

// openfootball times look like "13:00 UTC-6" (kickoff in local stadium time).
function toUtcDate(date, time) {
  const m = /^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})(?::?(\d{2}))?$/.exec(time ?? "");
  if (!m) return `${date}T12:00:00.000Z`;
  const [, hours, minutes, offsetHours, offsetMinutes] = m;
  const sign = Number(offsetHours) < 0 ? -1 : 1;
  const offsetMs =
    (Number(offsetHours) * 60 + sign * Number(offsetMinutes ?? 0)) * 60_000;
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(
    Date.UTC(y, mo - 1, d, Number(hours), Number(minutes)) - offsetMs
  ).toISOString();
}

// Knockout fixtures use placeholders ("W101" = winner of match 101, "1A" = Group A winner).
function teamName(raw) {
  const name = typeof raw === "string" ? raw : raw?.name ?? "TBD";
  let m;
  if ((m = /^W(\d+)$/.exec(name))) return `Winner Match ${m[1]}`;
  if ((m = /^L(\d+)$/.exec(name))) return `Loser Match ${m[1]}`;
  if ((m = /^1([A-L])$/.exec(name))) return `Group ${m[1]} Winner`;
  if ((m = /^2([A-L])$/.exec(name))) return `Group ${m[1]} Runner-up`;
  if (/^3([A-L]\/?)+$/.test(name)) return "Third-place Qualifier";
  return name;
}

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
const data = await res.json();

const raw = Array.isArray(data.matches)
  ? data.matches
  : (data.rounds ?? []).flatMap((r) => r.matches.map((m) => ({ round: r.name, ...m })));
if (!raw.length) throw new Error("No matches found in source JSON");

const matches = raw
  .map((m, i) => ({
    id: -(i + 1),
    utcDate: toUtcDate(m.date, m.time),
    status: "TIMED",
    matchday: /^Matchday (\d+)/.exec(m.round ?? "")
      ? Number(/^Matchday (\d+)/.exec(m.round)[1])
      : null,
    stage: toStage(m.round),
    group: m.group ? m.group.toUpperCase().replace(/\s+/g, "_") : null,
    venue: m.ground ?? null,
    homeTeam: { name: teamName(m.team1), tla: null, crest: null },
    awayTeam: { name: teamName(m.team2), tla: null, crest: null },
    score: {
      winner: null,
      fullTime: {
        home: m.score?.ft?.[0] ?? null,
        away: m.score?.ft?.[1] ?? null,
      },
    },
  }))
  .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

await writeFile(OUT, JSON.stringify(matches, null, 2));
console.log(`Wrote ${matches.length} matches to ${OUT}`);
