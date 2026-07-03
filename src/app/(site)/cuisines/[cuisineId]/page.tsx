import { CuisineDetailPage } from "@/components/pages/Cuisines/CuisineDetailPage";

export default async function Page({ params }: { params: Promise<{ cuisineId: string }> }) {
  const { cuisineId } = await params;

  return <CuisineDetailPage cuisineId={decodeURIComponent(cuisineId)} />;
}
