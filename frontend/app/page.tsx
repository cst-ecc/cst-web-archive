import Hero from "@/components/home/Hero";
import StatsBlock from "@/components/home/StatsBlock";
import FeaturedDocuments from "@/components/home/FeaturedDocuments";
import RecentDocuments from "@/components/home/RecentDocuments";
import RecentSessions from "@/components/home/RecentSessions";
import {
  getFeaturedDocuments,
  getRecentDocuments,
  getRecentSessions,
  getStats,
} from "@/lib/api";

// Revalidation ISR (utile une fois l'API Django branchée).
export const revalidate = 300;

export default async function HomePage() {
  const [featured, recentDocs, sessions, stats] = await Promise.all([
    getFeaturedDocuments(4),
    getRecentDocuments(6),
    getRecentSessions(3),
    getStats(),
  ]);

  return (
    <>
      <Hero />
      <StatsBlock stats={stats} />
      <FeaturedDocuments documents={featured} />
      <RecentDocuments documents={recentDocs} />
      <RecentSessions sessions={sessions} />
    </>
  );
}
