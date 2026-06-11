"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { StreamSource } from "@/lib/types";
import SourceSwitcher from "./SourceSwitcher";
import { useHlsPlayer } from "./useHlsPlayer";

type Props = {
  streams: StreamSource[];
  channelName: string;
};

type Blocked = "sources-exhausted" | "stream-dropped" | null;

export default function VideoPlayer({ streams, channelName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<number>>(new Set());
  const [autoNotice, setAutoNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Blocked>(null);
  const [muted, setMuted] = useState(true);

  const active = streams[Math.min(activeIndex, streams.length - 1)];

  const selectSource = (index: number) => {
    setFailed((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setAutoNotice(null);
    setBlocked(null);
    setReloadToken((t) => t + 1); // re-attempt even when the index is unchanged
    setActiveIndex(index);
  };

  const retryAllSources = () => {
    setFailed(new Set());
    setAutoNotice(null);
    setBlocked(null);
    setReloadToken((t) => t + 1);
    setActiveIndex(0);
  };

  // Startup failures walk through the remaining sources automatically;
  // mid-stream drops never switch away from a source the viewer was watching.
  const handleFatalError = (startedPlaying: boolean) => {
    if (startedPlaying) {
      setBlocked("stream-dropped");
      return;
    }
    const updated = new Set(failed).add(activeIndex);
    setFailed(updated);
    for (let step = 1; step < streams.length; step++) {
      const candidate = (activeIndex + step) % streams.length;
      if (!updated.has(candidate)) {
        setAutoNotice(
          `Source ${activeIndex + 1} unavailable — switching to Source ${candidate + 1}…`
        );
        setActiveIndex(candidate);
        return;
      }
    }
    setAutoNotice(null);
    setBlocked("sources-exhausted");
  };

  const { state } = useHlsPlayer(videoRef, active?.url ?? "", {
    reloadToken,
    onFatalError: handleFatalError,
  });

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    video.play().catch(() => {});
  };

  const showOverlay = blocked !== null || state === "unsupported";

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          controls
          className="h-full w-full"
        />

        {state === "loading" && !showOverlay && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pitch border-t-transparent" />
            <p className="px-4 text-center text-sm text-muted">
              {autoNotice ?? `Tuning in to ${channelName}…`}
            </p>
          </div>
        )}

        {state === "playing" && muted && (
          <button
            onClick={unmute}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full bg-pitch px-4 py-2 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-105"
          >
            🔊 Tap to unmute
          </button>
        )}

        {showOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
            {state === "unsupported" ? (
              <p className="text-lg font-semibold">
                Your browser cannot play HLS streams.
              </p>
            ) : blocked === "sources-exhausted" ? (
              <>
                <p className="text-lg font-semibold">
                  All {streams.length} source
                  {streams.length === 1 ? " is" : "s are"} unavailable for this
                  channel.
                </p>
                <p className="max-w-md text-sm text-muted">
                  Public streams are often taken offline or geo-blocked by the
                  broadcaster. Try again later or pick another channel.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">The stream dropped.</p>
                <p className="max-w-md text-sm text-muted">
                  This can be a temporary glitch — reload the source or try
                  another one.
                </p>
              </>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {blocked === "stream-dropped" && (
                <button
                  onClick={() => selectSource(activeIndex)}
                  className="rounded-full bg-pitch px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
                >
                  Reload
                </button>
              )}
              {blocked === "stream-dropped" && streams.length > 1 && (
                <button
                  onClick={() => selectSource((activeIndex + 1) % streams.length)}
                  className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-pitch"
                >
                  Try next source
                </button>
              )}
              {blocked === "sources-exhausted" && (
                <button
                  onClick={retryAllSources}
                  className="rounded-full bg-pitch px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
                >
                  Retry all sources
                </button>
              )}
              <Link
                href="/channels"
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-pitch"
              >
                Browse other channels
              </Link>
            </div>
          </div>
        )}
      </div>

      {streams.length > 1 && (
        <SourceSwitcher
          streams={streams}
          activeIndex={Math.min(activeIndex, streams.length - 1)}
          failedIndices={failed}
          onSelect={selectSource}
        />
      )}
    </div>
  );
}
