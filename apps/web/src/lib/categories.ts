import "server-only";
import { Category } from "../../types";

export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ["id", "slug", "categoryId", "categoryName"].every(
      (key) => typeof item[key] === "string",
    ) &&
    (item.categoryImage === null || typeof item.categoryImage === "string")
  );
}

export async function getCategories(): Promise<Category[]> {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/categories`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error("Kategoriler alınamadı.");

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isCategory)) {
    throw new Error("Kategori yanıtı beklenen yapıda değil.");
  }

  return data;
}
