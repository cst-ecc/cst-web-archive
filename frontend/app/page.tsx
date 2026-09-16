import HomeV2 from "@/components/home-v2/HomeV2";
import {
  getRecentNews,
  getHomeSpecialNews,
} from "@/lib/api";

export const revalidate = 300;

export default async function HomePage() {
  const [
    newsItems,
    specialNewsItems,
  ] = await Promise.all([
    getRecentNews(6),
    getHomeSpecialNews(),
  ]);

  return (
    <HomeV2
      newsItems={newsItems}
      specialNewsItems={specialNewsItems}
    />
  );
}