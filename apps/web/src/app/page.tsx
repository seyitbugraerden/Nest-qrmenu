import { Suspense } from "react";
import { connection } from "next/server";
import MenuLoader from "@/components/menu-loader";
import MenuView from "@/components/menu/menu-view";
import { demoProducts } from "@/data/demo-menu";
import { getCategories } from "@/lib/categories";

async function CategoriesMenu() {
  // Cache Components açık: bu bölüm gerçek istek geldiğinde sunucuda çalışır.
  await connection();

  try {
    const categories = await getCategories();
    const categoryIds = new Set(categories.map((item) => item.categoryId));

    return (
      <MenuView
        categories={categories}
        products={demoProducts.filter((item) =>
          categoryIds.has(item.categoryId),
        )}
      />
    );
  } catch {
    return (
      <MenuView
        categories={[]}
        products={[]}
        error="Kategoriler şu anda yüklenemiyor. Lütfen sayfayı yenileyerek tekrar deneyin."
      />
    );
  }
}

export default function Home() {
  return (
    <Suspense fallback={<MenuLoader />}>
      <CategoriesMenu />
    </Suspense>
  );
}
