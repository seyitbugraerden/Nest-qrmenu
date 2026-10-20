"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Category, Product } from "../../../types";
import {
  loadProduct,
  updateProduct,
  deleteProduct,
  type ProductChanges,
} from "@/app/admin/product-actions";
import styles from "./admin.module.css";

type Props = {
  product: Product;
  categories: Category[];
  categoryError: string | null;
  mode: "edit" | "delete";
  onClose: () => void;
  onSaved: (message: string) => void;
};
const values = (product: Product) => ({
  name: product.productName,
  price: String(product.productPrice),
  discount: String(product.productDiscount ?? "0"),
  image: product.productImage ?? "",
  categoryId: product.categoryId,
});

export default function ProductEditDialog({
  product,
  categories,
  categoryError,
  mode,
  onClose,
  onSaved,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [record, setRecord] = useState(product);
  const [fields, setFields] = useState(values(product));
  const [loading, setLoading] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const field = (key: keyof typeof fields, value: string) =>
    setFields((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadFailed(false);
      setError("");
      try {
        const result = await loadProduct(product.id);
        if (cancelled) return;
        if (result.success) {
          setRecord(result.product);
          setFields(values(result.product));
        } else {
          setLoadFailed(true);
          setError(result.message);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setError("Ürün bilgileri alınamadı. Tekrar deneyin.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [product.id, mode, attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || loading || loadFailed) return;
    const changes: ProductChanges = {};
    if (fields.name.trim() !== record.productName)
      changes.productName = fields.name.trim();
    if (Number(fields.price) !== Number(record.productPrice))
      changes.productPrice = fields.price;
    if (Number(fields.discount) !== Number(record.productDiscount ?? 0))
      changes.productDiscount = fields.discount;
    if ((fields.image.trim() || null) !== record.productImage)
      changes.productImage = fields.image.trim() || null;
    if (fields.categoryId !== record.categoryId)
      changes.categoryId = fields.categoryId;
    if (mode === "edit" && !Object.keys(changes).length) {
      setError("Henüz bir değişiklik yapmadın.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "edit"
          ? await updateProduct(record.id, changes)
          : await deleteProduct(product.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      onSaved(
        `${result.product.productName} ${mode === "edit" ? "güncellendi" : "silindi"}.`,
      );
    } catch {
      setError("İşlem tamamlanamadı. Listeyi yenileyip tekrar deneyin.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const close = () => {
    if (!busyRef.current) dialog.current?.close();
  };
  return (
    <dialog
      ref={dialog}
      className={styles.categoryDialog}
      aria-labelledby="product-edit-title"
      aria-describedby="product-edit-description"
      onClose={onClose}
      onCancel={(event) => {
        if (busyRef.current) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form onSubmit={submit}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.eyebrow}>ÜRÜN İŞLEMLERİ</p>
            <h2 id="product-edit-title">
              {mode === "edit" ? "Ürünü düzenle" : "Ürünü sil"}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Pencereyi kapat"
          >
            ×
          </button>
        </div>
        <p id="product-edit-description" className={styles.dialogDescription}>
          {mode === "edit"
            ? "Ürün bilgilerini, fiyatını ve kategorisini güncelleyebilirsin."
            : `“${product.productName}” ürününü silmek istediğine emin misin? Bu işlem geri alınamaz.`}
        </p>
        {loading ? (
          <p role="status" className={styles.dialogDescription}>
            Güncel ürün bilgileri alınıyor…
          </p>
        ) : mode === "edit" && !loadFailed ? (
          <fieldset className={styles.fields} disabled={busy}>
            <label>
              Ürün adı
              <input
                required
                maxLength={150}
                value={fields.name}
                onChange={(event) => field("name", event.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Kategori
              <select
                required
                value={fields.categoryId}
                disabled={!!categoryError}
                onChange={(event) => field("categoryId", event.target.value)}
              >
                {!categories.some(
                  (item) => item.categoryId === fields.categoryId,
                ) && (
                  <option value={fields.categoryId}>{fields.categoryId}</option>
                )}
                {categories.map((category) => (
                  <option key={category.id} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              {categoryError && (
                <small>Kategoriler alınamadı. Mevcut kategori korunacak.</small>
              )}
            </label>
            <div className={styles.formColumns}>
              <label>
                Fiyat (₺)
                <input
                  type="number"
                  required
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  value={fields.price}
                  onChange={(event) => field("price", event.target.value)}
                />
              </label>
              <label>
                İndirim (%)
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={fields.discount}
                  onChange={(event) => field("discount", event.target.value)}
                />
                <small>İndirimi kaldırmak için 0 gir.</small>
              </label>
            </div>
            <label>
              Görsel adresi
              <input
                type="url"
                value={fields.image}
                onChange={(event) => field("image", event.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              <small>
                Görseli kaldırmak için boş bırak. Ön yüz Unsplash görsellerini
                destekler.
              </small>
            </label>
            <p className={styles.dialogCode}>
              Ürün kodu: <code>{record.productId}</code>
            </p>
          </fieldset>
        ) : null}
        {error && (
          <p className={styles.dialogError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={busy}
            onClick={close}
          >
            Vazgeç
          </button>
          {loadFailed ? (
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tekrar yükle
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy || loading}
              className={
                mode === "delete" ? styles.deleteButton : styles.saveButton
              }
            >
              {busy
                ? "İşleniyor…"
                : mode === "edit"
                  ? "Değişiklikleri kaydet"
                  : "Ürünü sil"}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
