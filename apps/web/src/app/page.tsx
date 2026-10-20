import { Suspense } from "react";
import { connection } from "next/server";
import MenuLoader from "@/components/menu-loader";
import MenuView from "@/components/menu/menu-view";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function DynamicMenu({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const categorySlug =
    typeof params.category === "string"
      ? params.category || undefined
      : undefined;
  const [categoryResult, productResult] = await Promise.allSettled([
    getCategories(),
    getProducts(categorySlug),
  ]);
  const categories =
    categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const products =
    productResult.status === "fulfilled" ? productResult.value : [];
  const error =
    categoryResult.status === "rejected"
      ? "Kategoriler yüklenemedi. Lütfen tekrar deneyin."
      : productResult.status === "rejected"
        ? "Ürünler yüklenemedi. Lütfen tekrar deneyin."
        : categorySlug &&
            !categories.some((category) => category.slug === categorySlug)
          ? "Bu kategori bulunamadı. Başka bir kategori seçebilirsiniz."
          : null;

  return (
    <MenuView
      categories={categories}
      products={products}
      categorySlug={categorySlug ?? null}
      error={error}
    />
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<MenuLoader />}>
      <DynamicMenu searchParams={searchParams} />
    </Suspense>
  );
}
