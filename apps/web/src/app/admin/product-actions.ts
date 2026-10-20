"use server";

import { revalidatePath } from "next/cache";
import { adminActionAuthorization } from "@/lib/admin-auth";
import { randomUUID } from "node:crypto";
import type { Product } from "../../../types";
import { isProduct } from "@/lib/products";
import { getCategories } from "@/lib/categories";

export type ProductChanges = {
  productName?: string;
  productPrice?: string;
  productDiscount?: string;
  categoryId?: string;
  productImage?: string | null;
};
export type ProductActionResult =
  { success: true; product: Product } | { success: false; message: string };

async function requestProduct(
  id: string,
  method: "GET" | "PATCH" | "DELETE" | "POST",
  changes?: ProductChanges & { productId?: string },
): Promise<ProductActionResult> {
  if (
    method !== "POST" &&
    (typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ))
  )
    return { success: false, message: "Geçerli bir ürün seçin." };
  const authorization = await adminActionAuthorization();
  try {
    const base = process.env.API_URL ?? "http://localhost:3001";
    const response = await fetch(
      `${base.replace(/\/$/, "")}${method === "POST" ? "/products" : `/products/detail/${encodeURIComponent(id)}`}`,
      {
        method,
        headers: authorization,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        ...(changes
          ? {
              headers: { ...authorization, "Content-Type": "application/json" },
              body: JSON.stringify(changes),
            }
          : {}),
      },
    );
    if (!response.ok)
      return {
        success: false,
        message:
          response.status === 404
            ? "Ürün bulunamadı. Listeyi yenileyin."
            : response.status === 409
              ? method === "DELETE"
                ? "Ürün başka kayıtlarla ilişkili olduğu için silinemiyor."
                : "Gönderilen bilgiler başka bir kayıtta kullanılıyor."
              : response.status === 400
                ? "Ürün bilgileri geçerli değil."
                : "İşlem tamamlanamadı. Kategori ve görsel bilgilerinin geçerliliğini kontrol edip tekrar deneyin.",
      };
    const text = await response.text();
    // Mevcut backend, bulunamayan GET/PATCH için boş 200 döndürebiliyor.
    if (!text.trim())
      return { success: false, message: "Ürün bulunamadı. Listeyi yenileyin." };
    const product: unknown = JSON.parse(text);
    if (!isProduct(product))
      return {
        success: false,
        message: "Beklenen ürün yanıtı alınamadı. Listeyi yenileyin.",
      };
    if (method !== "GET") {
      revalidatePath("/admin");
      revalidatePath("/");
    }
    return { success: true, product };
  } catch {
    return {
      success: false,
      message:
        "API’ye ulaşılamadı veya istek zaman aşımına uğradı. Listeyi yenileyip tekrar deneyin.",
    };
  }
}

export async function loadProduct(id: string): Promise<ProductActionResult> {
  await adminActionAuthorization();
  return requestProduct(id, "GET");
}
export async function deleteProduct(id: string): Promise<ProductActionResult> {
  await adminActionAuthorization();
  return requestProduct(id, "DELETE");
}

async function validateProductInput(
  input: ProductChanges,
): Promise<
  | { success: true; changes: ProductChanges }
  | { success: false; message: string }
> {
  if (!input || typeof input !== "object")
    return { success: false, message: "Ürün bilgileri geçerli değil." };
  const changes: ProductChanges = {};
  if (input.productName !== undefined) {
    if (
      typeof input.productName !== "string" ||
      !input.productName.trim() ||
      input.productName.trim().length > 150
    )
      return { success: false, message: "Ürün adı 1–150 karakter olmalıdır." };
    changes.productName = input.productName.trim();
  }
  for (const key of ["productPrice", "productDiscount"] as const) {
    const value = input[key];
    if (value !== undefined) {
      if (
        typeof value !== "string" ||
        !/^\d{1,8}(\.\d{1,2})?$/.test(value.trim()) ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        (key === "productDiscount" && Number(value) > 100)
      )
        return {
          success: false,
          message:
            key === "productPrice"
              ? "Fiyat negatif olmamalı ve en fazla iki ondalık basamak içermelidir."
              : "İndirim 0–100 arasında ve en fazla iki ondalık basamaklı olmalıdır.",
        };
      changes[key] = Number(value).toFixed(2);
    }
  }
  if (input.productImage !== undefined) {
    if (input.productImage !== null && typeof input.productImage !== "string")
      return { success: false, message: "Görsel adresi geçerli değil." };
    const image = input.productImage?.trim() || null;
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
          message: "Geçerli bir http veya https görsel adresi girin.",
        };
      }
    }
    changes.productImage = image;
  }
  if (input.categoryId !== undefined) {
    if (typeof input.categoryId !== "string" || !input.categoryId.trim())
      return { success: false, message: "Bir kategori seçin." };
    try {
      const categories = await getCategories();
      if (
        !categories.some((category) => category.categoryId === input.categoryId)
      )
        return {
          success: false,
          message: "Seçilen kategori bulunamadı. Listeyi yenileyin.",
        };
    } catch {
      return {
        success: false,
        message: "Kategori doğrulanamadı. Lütfen tekrar deneyin.",
      };
    }
    changes.categoryId = input.categoryId;
  }
  if (!Object.keys(changes).length)
    return { success: false, message: "Güncellenecek alan gönderilmedi." };
  return { success: true, changes };
}

export async function updateProduct(
  id: string,
  input: ProductChanges,
): Promise<ProductActionResult> {
  await adminActionAuthorization();
  const validated = await validateProductInput(input);
  if (!validated.success) return validated;
  return requestProduct(id, "PATCH", validated.changes);
}

export async function createProduct(
  input: ProductChanges,
): Promise<ProductActionResult> {
  await adminActionAuthorization();
  if (
    !input ||
    typeof input.productName !== "string" ||
    typeof input.productPrice !== "string" ||
    typeof input.categoryId !== "string"
  )
    return {
      success: false,
      message: "Ürün adı, fiyat ve kategori zorunludur.",
    };
  const validated = await validateProductInput(input);
  if (!validated.success) return validated;
  return requestProduct("", "POST", {
    ...validated.changes,
    productDiscount: validated.changes.productDiscount ?? "0.00",
    productImage: validated.changes.productImage ?? null,
    productId: randomUUID(),
  });
}
