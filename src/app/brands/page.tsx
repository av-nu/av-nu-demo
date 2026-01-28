import { mockBrands } from "@/data/mockBrands";
import { BrandsClient } from "./BrandsClient";

export default function BrandsPage() {
  return <BrandsClient brands={mockBrands} />;
}
