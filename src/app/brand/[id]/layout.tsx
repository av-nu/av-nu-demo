import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getBrandById } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const brand = getBrandById(params.id);

  if (!brand) {
    return {
      title: "Brand",
    };
  }

  return {
    title: brand.name,
  };
}

export default function BrandLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
