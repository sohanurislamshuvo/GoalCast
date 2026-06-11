"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type PlayerState = "loading" | "playing" | "error" | "unsupported";
export type PlayerErrorKind = "network" | "media" | null;

type Options = {
  /** Bump to force a reload of the same src (e.g. retrying a failed source). */
  reloadToken?: number;
  /**
   * Called once per fatal failure. `startedPlaying` distinguishes a source
   * that never produced video (safe to auto-skip) from a mid-stream drop
   * (the viewer was watching — never switch away automatically).
   */
  onFatalError?: (startedPlaying: boolean) => void;
};

export function useHlsPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  { reloadToken = 0, onFatalError }: Options = {}
) {
  const [state, setState] = useState<PlayerState>("loading");
  const [errorKind, setErrorKind] = useState<PlayerErrorKind>(null);
  const onFatalErrorRef = useRef(onFatalError);

  useEffect(() => {
    onFatalErrorRef.current = onFatalError;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: import("hls.js").default | undefined;
    let cancelled = false;
    let started = false;
    setState("loading");
    setErrorKind(null);

    const fail = (kind: Exclude<PlayerErrorKind, null>) => {
      if (cancelled) return;
      setErrorKind(kind);
      setState("error");
      onFatalErrorRef.current?.(started);
    };

    const onPlaying = () => {
      started = true;
      setState("playing");
    };
    const onNativeError = () => fail("network");
    video.addEventListener("playing", onPlaying);

    // Prefer native HLS (Safari/iOS): the media element fetches segments in
    // no-cors mode, so streams without CORS headers still play there.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("error", onNativeError);
      video.play().catch(() => {
        // Autoplay rejection — user can press play via the native controls.
      });
    } else {
      void (async () => {
        // Dynamic import keeps ~110 KB gz of hls.js off every other page.
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setState("unsupported");
          return;
        }
        hls = new Hls({ maxBufferLength: 30 });
        let networkRetries = 2;
        let mediaRetries = 2;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || !hls) return;
          // A 4xx on a playlist/segment never heals (dead link, geo-block) —
          // fail immediately so the player can move on to the next source
          // instead of burning seconds on pointless retries.
          const httpCode = data.response?.code;
          const permanent =
            typeof httpCode === "number" && httpCode >= 400 && httpCode < 500;
          if (
            data.type === Hls.ErrorTypes.NETWORK_ERROR &&
            !permanent &&
            networkRetries-- > 0
          ) {
            hls.startLoad();
          } else if (
            data.type === Hls.ErrorTypes.MEDIA_ERROR &&
            mediaRetries-- > 0
          ) {
            hls.recoverMediaError();
          } else {
            const kind =
              data.type === Hls.ErrorTypes.NETWORK_ERROR ? "network" : "media";
            hls.destroy();
            hls = undefined;
            fail(kind);
          }
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      })();
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      hls = undefined;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onNativeError);
      video.removeAttribute("src");
      video.load();
    };
  }, [videoRef, src, reloadToken]);

  return { state, errorKind };
}
