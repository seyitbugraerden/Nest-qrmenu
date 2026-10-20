import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import styles from "@/components/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Nest | Yönetim Paneli",
  robots: { index: false, follow: false },
};

async function AdminData() {
  await connection();
  const [categories, products] = await Promise.allSettled([
    getCategories(),
    getProducts(),
  ]);
  return (
    <AdminDashboard
      categories={categories.status === "fulfilled" ? categories.value : []}
      products={products.status === "fulfilled" ? products.value : []}
      categoryError={
        categories.status === "rejected"
          ? "Kategoriler alınamadı. API bağlantısını kontrol edip tekrar deneyin."
          : null
      }
      productError={
        products.status === "rejected"
          ? "Ürünler alınamadı. API bağlantısını kontrol edip tekrar deneyin."
          : null
      }
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading} role="status">
          <span className={styles.spinner} />
          <strong>nest.</strong>
          <p>Yönetim paneli yükleniyor…</p>
        </div>
      }
    >
      <AdminData />
    </Suspense>
  );
}
