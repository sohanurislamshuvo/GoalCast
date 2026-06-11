import type { MatchStatus } from "./types";

const LIVE_STATUSES: MatchStatus[] = [
  "IN_PLAY",
  "PAUSED",
  "EXTRA_TIME",
  "PENALTY_SHOOTOUT",
];

export function isLive(status: MatchStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

export function isUpcoming(status: MatchStatus): boolean {
  return status === "SCHEDULED" || status === "TIMED";
}

export function countryFlag(code: string | null): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))
  );
}

export function humanizeStage(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function humanizeGroup(group: string | null): string | null {
  return group ? group.replace("GROUP_", "Group ") : null;
}
