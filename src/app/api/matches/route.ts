import { getWorldCupMatches } from "@/lib/worldcup";

export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  return Response.json(await getWorldCupMatches());
}
