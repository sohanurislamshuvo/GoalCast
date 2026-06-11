import type { Metadata } from "next";
import ChannelBrowser from "@/components/ChannelBrowser";
import { getAllChannels } from "@/lib/channels";

export const dynamic = "force-static";
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Channels — GoalCast",
};

export default async function ChannelsPage() {
  const channels = await getAllChannels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Live channels</h1>
        <p className="mt-2 text-sm text-muted">
          Your curated channels plus free public sports channels from the
          iptv-org index. Public stream reliability varies — if one fails, try
          another source or channel.
        </p>
      </div>
      <ChannelBrowser channels={channels} />
    </div>
  );
}
