import { mockBrands } from "@/data/mockBrands";
import { getBrandAttributes, getBrandAverageRating, getBrandFilterMetadata, getBrandWindowImages } from "@/lib/data";
import { BrandsClient, type BrandWindowData } from "./BrandsClient";

export default function BrandsPage() {
  const windows: BrandWindowData[] = mockBrands.map((brand) => {
    const { average, productCount } = getBrandAverageRating(brand.id);
    const { heroImage, products } = getBrandWindowImages(brand.id);
    return {
      brand,
      averageRating: average,
      productCount,
      heroImage,
      products,
      attributes: getBrandAttributes(brand.id),
      filters: getBrandFilterMetadata(brand.id),
    };
  });

  return <BrandsClient windows={windows} />;
}
