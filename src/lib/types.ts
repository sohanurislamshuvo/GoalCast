export type StreamSource = {
  url: string;
  quality?: string | null;
  label?: string | null;
};

export type ChannelSource = "curated" | "iptv-org";

export type TvChannel = {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
  source: ChannelSource;
  featured?: boolean;
  description?: string;
  streams: StreamSource[];
};

export type ChannelsPayload = {
  channels: TvChannel[];
};

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "EXTRA_TIME"
  | "PENALTY_SHOOTOUT"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export type WcTeam = {
  name: string;
  tla: string | null;
  crest: string | null;
};

export type WcMatch = {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null;
  venue: string | null;
  homeTeam: WcTeam;
  awayTeam: WcTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
};

export type MatchesPayload = {
  source: "api" | "fallback";
  lastUpdated: string;
  matches: WcMatch[];
};
