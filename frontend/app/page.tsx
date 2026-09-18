import HomeV2 from "@/components/home-v2/HomeV2";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
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
    <> 
    <HomeStructuredData />
      <HomeV2
        newsItems={newsItems}
        specialNewsItems={specialNewsItems}
      /> 
    </>

  );
}