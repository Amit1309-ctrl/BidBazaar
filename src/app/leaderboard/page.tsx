import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { LeaderboardBoard } from "@/components/LeaderboardBoard";
import { CategoryFilterBar, CityFilterBar } from "@/components/CategoryFilterBar";
import { ClaimSpotForm } from "@/components/ClaimSpotForm";
import { getLeaderboard } from "@/lib/data";

export const metadata = { title: "Leaderboard" };
export const revalidate = 30;

export default async function LeaderboardPage() {
  const listings = await getLeaderboard();

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-ink-secondary">Ranked by current bid. Refreshed live as new bids are placed.</p>

        <div className="mt-6 space-y-3">
          <CategoryFilterBar />
          <CityFilterBar />
        </div>

        <div className="mt-8">
          <LeaderboardBoard listings={listings} />
        </div>

        <div className="mt-14 max-w-xl">
          <ClaimSpotForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
