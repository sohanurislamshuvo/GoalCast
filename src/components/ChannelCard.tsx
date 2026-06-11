"use client";

import Link from "next/link";
import { countryFlag } from "@/lib/format";
import type { TvChannel } from "@/lib/types";

const PLACEHOLDER = "/channel-placeholder.svg";

export default function ChannelCard({ channel }: { channel: TvChannel }) {
  return (
    <Link
      href={`/watch/${encodeURIComponent(channel.id)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-pitch/60 hover:shadow-[0_0_24px_rgba(25,212,101,0.12)]"
    >
      <div className="flex h-28 items-center justify-center bg-surface-2 p-4">
        {/* Plain <img>: logos come from hundreds of arbitrary hosts, which
            next/image remotePatterns can't reasonably whitelist. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={channel.logo ?? PLACEHOLDER}
          alt=""
          loading="lazy"
          className="max-h-16 max-w-[70%] object-contain"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER)) {
              e.currentTarget.src = PLACEHOLDER;
            }
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold group-hover:text-pitch">
          {channel.name}
        </p>
        <p className="text-xs text-muted">
          {countryFlag(channel.country)} {channel.country ?? "Worldwide"}
          {" · "}
          {channel.source === "curated" ? "My channels" : "Public"}
        </p>
      </div>
    </Link>
  );
}
