"use client";

import type { StreamSource } from "@/lib/types";

type Props = {
  streams: StreamSource[];
  activeIndex: number;
  failedIndices?: ReadonlySet<number>;
  onSelect: (index: number) => void;
};

export default function SourceSwitcher({
  streams,
  activeIndex,
  failedIndices,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted">Sources</span>
      {streams.map((stream, i) => {
        const detail = stream.quality || stream.label;
        const hasFailed = failedIndices?.has(i) && i !== activeIndex;
        return (
          <button
            key={`${stream.url}-${i}`}
            onClick={() => onSelect(i)}
            title={
              hasFailed
                ? "This source failed recently — click to retry it"
                : undefined
            }
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              i === activeIndex
                ? "border-pitch bg-pitch/15 text-pitch"
                : hasFailed
                  ? "border-live/40 bg-live/5 text-live/70 hover:border-live hover:text-live"
                  : "border-border bg-surface text-muted hover:border-pitch/50 hover:text-foreground"
            }`}
          >
            {hasFailed ? "⚠ " : ""}Source {i + 1}
            {detail ? ` · ${detail}` : ""}
          </button>
        );
      })}
    </div>
  );
}
