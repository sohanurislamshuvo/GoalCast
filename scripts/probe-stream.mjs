// Probe an HLS stream URL the way a browser running hls.js would:
// master playlist → first variant → first media segment, sending an Origin
// header, and report HTTP status + CORS (Access-Control-Allow-Origin) per hop.
// A hop without ACAO plays in VLC/curl but is BLOCKED in Chrome/Firefox.
//
// Usage: node scripts/probe-stream.mjs <m3u8-url> [origin]
const url = process.argv[2];
const ORIGIN = process.argv[3] ?? "http://localhost:3100";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function hop(u, asSegment) {
  try {
    const res = await fetch(u, {
      headers: {
        origin: ORIGIN,
        "user-agent": UA,
        ...(asSegment ? { range: "bytes=0-1" } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const body = asSegment ? "" : await res.text().catch(() => "");
    return {
      status: res.status,
      acao: res.headers.get("access-control-allow-origin"),
      contentType: res.headers.get("content-type"),
      finalUrl: res.url,
      body,
    };
  } catch (e) {
    return {
      status: 0,
      acao: null,
      body: "",
      error: String(e?.cause?.code ?? e?.cause?.message ?? e?.name ?? e),
    };
  }
}

function firstUri(playlist, base) {
  for (const line of playlist.split(/\r?\n/)) {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      try {
        return new URL(t, base).href;
      } catch {
        return null;
      }
    }
  }
  return null;
}

const summarize = (h, withUrl) => ({
  ...(withUrl ? { url: withUrl.slice(0, 220) } : {}),
  status: h.status,
  acao: h.acao,
  contentType: h.contentType,
  error: h.error,
});

const out = { url };
const master = await hop(url);
out.master = summarize(master);
out.master.bodyStart = master.body.slice(0, 120);
out.isHls = master.body.trimStart().startsWith("#EXTM3U");

if (master.status === 200 && out.isHls) {
  if (master.body.includes("#EXTINF")) {
    // Master is itself a media playlist — next hop is a segment.
    const segUrl = firstUri(master.body, master.finalUrl);
    if (segUrl) out.segment = summarize(await hop(segUrl, true), segUrl);
  } else {
    const variantUrl = firstUri(master.body, master.finalUrl);
    if (variantUrl) {
      const variant = await hop(variantUrl);
      out.variant = summarize(variant, variantUrl);
      if (variant.status === 200 && variant.body.includes("#EXTINF")) {
        const segUrl = firstUri(variant.body, variant.finalUrl);
        if (segUrl) out.segment = summarize(await hop(segUrl, true), segUrl);
      }
    }
  }
}

console.log(JSON.stringify(out, null, 1));
