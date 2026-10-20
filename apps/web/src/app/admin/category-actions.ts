"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import type { Category } from "../../../types";
import { isCategory } from "@/lib/categories";

export type CategoryActionResult =
  { success: true; category: Category } | { success: false; message: string };
export type CategoryChanges = {
  categoryName?: string;
  slug?: string;
  categoryImage?: string | null;
};

async function requestCategory(
  slug: string,
  method: "GET" | "PATCH" | "DELETE" | "POST",
  changes?: CategoryChanges & { categoryId?: string },
): Promise<CategoryActionResult> {
  if (
    method !== "POST" &&
    (typeof slug !== "string" || !slug.trim() || slug.length > 250)
  )
    return { success: false, message: "Geçerli bir kategori seçin." };
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}${method === "POST" ? "/categories" : `/categories/${encodeURIComponent(slug)}`}`,
      {
        method,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        ...(changes
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(changes),
            }
          : {}),
      },
    );
    if (!response.ok) {
      const message =
        response.status === 404
          ? "Kategori bulunamadı. Listeyi yenileyin."
          : response.status === 409
            ? method === "DELETE"
              ? "Bu kategoride ürünler var. Önce ürünleri taşımalı veya silmelisin."
              : "Bu slug veya görsel adresi başka bir kategoride kullanılıyor."
            : response.status === 400
              ? "Gönderilen kategori bilgileri geçerli değil."
              : "İşlem tamamlanamadı. Bağlantıyı ve kategori bilgilerinin benzersizliğini kontrol edip tekrar deneyin.";
      return { success: false, message };
    }
    const category: unknown = await response.json();
    if (!isCategory(category))
      return {
        success: false,
        message:
          "Sunucudan beklenen kategori yanıtı alınamadı. Listeyi yenileyin.",
      };
    if (method !== "GET") {
      revalidatePath("/admin");
      revalidatePath("/");
    }
    return { success: true, category };
  } catch {
    return {
      success: false,
      message:
        "API’ye ulaşılamadı veya istek zaman aşımına uğradı. Listeyi yenileyip tekrar deneyin.",
    };
  }
}

export async function loadCategory(
  slug: string,
): Promise<CategoryActionResult> {
  return requestCategory(slug, "GET");
}

function validateCategoryInput(
  input: CategoryChanges,
):
  | { success: true; changes: CategoryChanges }
  | { success: false; message: string } {
  if (!input || typeof input !== "object")
    return { success: false, message: "Kategori bilgileri geçerli değil." };
  const changes: CategoryChanges = {};
  if (input.categoryName !== undefined) {
    if (
      typeof input.categoryName !== "string" ||
      !input.categoryName.trim() ||
      input.categoryName.trim().length > 150
    )
      return {
        success: false,
        message: "Kategori adı 1–150 karakter olmalıdır.",
      };
    changes.categoryName = input.categoryName.trim();
  }
  if (input.slug !== undefined) {
    if (
      typeof input.slug !== "string" ||
      input.slug.length > 150 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)
    )
      return {
        success: false,
        message:
          "Slug küçük harf, rakam ve aralarda tire içermelidir. Örnek: sicak-kahveler",
      };
    changes.slug = input.slug;
  }
  if (input.categoryImage !== undefined) {
    if (input.categoryImage !== null && typeof input.categoryImage !== "string")
      return { success: false, message: "Görsel adresi geçerli değil." };
    const image = input.categoryImage?.trim() || null;
    if (image) {
      try {
        const url = new URL(image);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password
        )
          throw new Error();
      } catch {
        return {
          success: false,
          message:
            "Görsel adresi http veya https ile başlayan geçerli bir URL olmalıdır.",
        };
      }
    }
    changes.categoryImage = image;
  }
  if (!Object.keys(changes).length)
    return { success: false, message: "Güncellenecek alan gönderilmedi." };
  return { success: true, changes };
}

export async function updateCategory(
  slug: string,
  input: CategoryChanges,
): Promise<CategoryActionResult> {
  const validated = validateCategoryInput(input);
  if (!validated.success) return validated;
  return requestCategory(slug, "PATCH", validated.changes);
}

export async function createCategory(
  input: CategoryChanges,
): Promise<CategoryActionResult> {
  if (
    !input ||
    typeof input.categoryName !== "string" ||
    typeof input.slug !== "string"
  )
    return { success: false, message: "Kategori adı ve slug zorunludur." };
  const validated = validateCategoryInput(input);
  if (!validated.success) return validated;
  return requestCategory("", "POST", {
    ...validated.changes,
    categoryId: randomUUID(),
    categoryImage: validated.changes.categoryImage ?? null,
  });
}

export async function deleteCategory(
  slug: string,
): Promise<CategoryActionResult> {
  return requestCategory(slug, "DELETE");
}
