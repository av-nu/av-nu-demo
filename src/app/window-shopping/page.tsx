import { mockBrands } from "@/data/mockBrands";
import {
  getBrandAttributes,
  getBrandAverageRating,
  getBrandWindowImages,
} from "@/lib/data";
import {
  WindowShoppingClient,
  type BrandWindowData,
} from "./WindowShoppingClient";

export default function WindowShoppingPage() {
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
    };
  });

  return <WindowShoppingClient windows={windows} />;
}
