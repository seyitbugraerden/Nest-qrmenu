import "server-only";
import type { Product } from "@/types/menu";

function isNumeric(value: unknown): value is string | number {
  return (
    (typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) &&
    Number.isFinite(Number(value))
  );
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ["id", "productId", "productName", "categoryId"].every(
      (key) => typeof item[key] === "string",
    ) &&
    (item.productImage === null || typeof item.productImage === "string") &&
    isNumeric(item.productPrice) &&
    Number(item.productPrice) >= 0 &&
    (item.productDiscount === null ||
      (isNumeric(item.productDiscount) &&
        Number(item.productDiscount) >= 0 &&
        Number(item.productDiscount) <= 100))
  );
}

export async function getProducts(categorySlug?: string): Promise<Product[]> {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";
  const path = categorySlug
    ? `/products/${encodeURIComponent(categorySlug)}`
    : "/products";
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Ürünler alınamadı.");
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isProduct))
    throw new Error("Ürün yanıtı beklenen yapıda değil.");
  return data;
}
