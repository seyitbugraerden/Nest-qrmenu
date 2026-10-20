"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Category } from "../../../types";
import {
  deleteCategory,
  loadCategory,
  updateCategory,
  type CategoryChanges,
} from "@/app/admin/category-actions";
import styles from "./admin.module.css";

type Props = {
  category: Category;
  mode: "edit" | "delete";
  productCount?: number;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export default function CategoryDialog({
  category,
  mode,
  productCount,
  onClose,
  onSaved,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [record, setRecord] = useState(category);
  const [name, setName] = useState(category.categoryName);
  const [slug, setSlug] = useState(category.slug);
  const [image, setImage] = useState(category.categoryImage ?? "");
  const [loading, setLoading] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setLoadFailed(false);
      const result = await loadCategory(category.slug);
      if (cancelled) return;
      if (result.success) {
        setRecord(result.category);
        setName(result.category.categoryName);
        setSlug(result.category.slug);
        setImage(result.category.categoryImage ?? "");
      } else {
        setError(result.message);
        setLoadFailed(true);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [category.slug, mode, attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || loading || loadFailed) return;
    const changes: CategoryChanges = {};
    if (name.trim() !== record.categoryName) changes.categoryName = name.trim();
    if (slug.trim() !== record.slug) changes.slug = slug.trim();
    if ((image.trim() || null) !== record.categoryImage)
      changes.categoryImage = image.trim() || null;
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
          ? await updateCategory(record.slug, changes)
          : await deleteCategory(category.slug);
      if (!result.success) {
        setError(result.message);
        return;
      }
      onSaved(
        mode === "edit"
          ? `${result.category.categoryName} güncellendi.`
          : `${result.category.categoryName} silindi.`,
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
      aria-labelledby="category-dialog-title"
      aria-describedby="category-dialog-description"
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
            <p className={styles.eyebrow}>KATEGORİ İŞLEMLERİ</p>
            <h2 id="category-dialog-title">
              {mode === "edit" ? "Kategoriyi düzenle" : "Kategoriyi sil"}
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
        <p
          id="category-dialog-description"
          className={styles.dialogDescription}
        >
          {mode === "edit"
            ? "Kategori adı, menü bağlantısı ve görsel adresini güncelleyebilirsin."
            : `“${category.categoryName}” kategorisini silmek istediğine emin misin? Bu işlem geri alınamaz.`}
        </p>
        {loading ? (
          <p role="status" className={styles.dialogDescription}>
            Güncel kategori bilgileri alınıyor…
          </p>
        ) : mode === "edit" && !loadFailed ? (
          <fieldset disabled={busy} className={styles.fields}>
            <label>
              Kategori adı
              <input
                required
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Slug
              <input
                required
                maxLength={150}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Küçük harf, rakam ve aralarda tire kullanın."
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <small>
                Örnek: sicak-kahveler. Değiştirirsen eski kategori bağlantısı
                geçersiz olur.
              </small>
            </label>
            <label>
              Görsel adresi
              <input
                type="url"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              <small>
                Görseli kaldırmak için alanı boş bırak. Mevcut ön yüz Unsplash
                görsellerini destekler.
              </small>
            </label>
            <p className={styles.dialogCode}>
              Kategori kodu: <code>{record.categoryId}</code>
            </p>
          </fieldset>
        ) : null}
        {mode === "delete" &&
          productCount !== undefined &&
          productCount > 0 && (
            <p className={styles.dialogWarning}>
              Bu kategoriye bağlı {productCount} ürün var. Backend, ürünler
              taşınmadan veya silinmeden kategorinin silinmesine izin vermez.
            </p>
          )}
        {error && (
          <p className={styles.dialogError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={close}
            disabled={busy}
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
              disabled={loading || busy}
              className={
                mode === "delete" ? styles.deleteButton : styles.saveButton
              }
            >
              {busy
                ? "İşleniyor…"
                : mode === "edit"
                  ? "Değişiklikleri kaydet"
                  : "Kategoriyi sil"}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
