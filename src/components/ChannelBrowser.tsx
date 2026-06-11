"use client";

import { useMemo, useState } from "react";
import { countryFlag } from "@/lib/format";
import type { ChannelSource, TvChannel } from "@/lib/types";
import ChannelCard from "./ChannelCard";

type SourceFilter = "all" | ChannelSource;

export default function ChannelBrowser({ channels }: { channels: TvChannel[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const countries = useMemo(
    () =>
      [...new Set(channels.map((c) => c.country).filter(Boolean))].sort() as string[],
    [channels]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (country !== "all" && c.country !== country) return false;
      if (source !== "all" && c.source !== source) return false;
      return true;
    });
  }, [channels, query, country, source]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels… (e.g. espn)"
          className="w-full max-w-sm rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-pitch focus:outline-none"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground"
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {countryFlag(c)} {c}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {(
            [
              ["all", "All"],
              ["curated", "My channels"],
              ["iptv-org", "Public"],
            ] as [SourceFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSource(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                source === value
                  ? "bg-pitch text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">
        {filtered.length} channel{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">
          No channels match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      )}
    </div>
  );
}
