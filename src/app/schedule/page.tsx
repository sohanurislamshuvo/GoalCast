import type { Metadata } from "next";
import ScheduleView from "@/components/ScheduleView";
import { getWorldCupMatches } from "@/lib/worldcup";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "World Cup 2026 Schedule — GoalCast",
};

export default async function SchedulePage() {
  const payload = await getWorldCupMatches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          World Cup 2026 schedule
        </h1>
        <p className="mt-2 text-sm text-muted">
          All 104 matches across the United States, Canada and Mexico — kickoff
          times shown in your local timezone.
        </p>
      </div>
      <ScheduleView initial={payload} />
    </div>
  );
}
