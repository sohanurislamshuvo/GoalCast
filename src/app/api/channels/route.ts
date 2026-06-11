import { getAllChannels } from "@/lib/channels";

// The filtered channel list is cached as static route output (ISR) because
// the upstream iptv-org files are too large for the per-entry Data Cache.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const channels = await getAllChannels();
  return Response.json({ channels });
}
