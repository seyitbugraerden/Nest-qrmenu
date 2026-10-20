"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Category, Product } from "../../../types";
import MenuImage from "@/components/menu/menu-image";
import ProductPrice from "@/components/menu/product-price";
import styles from "./admin.module.css";
import CategoryDialog from "./category-dialog";
import ProductEditDialog from "./product-edit-dialog";

type Props = {
  categories: Category[];
  products: Product[];
  categoryError: string | null;
  productError: string | null;
};

export default function AdminDashboard({
  categories,
  products,
  categoryError,
  productError,
}: Props) {
  const router = useRouter();
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [productAction, setProductAction] = useState<{
    product: Product;
    mode: "edit" | "delete";
  } | null>(null);
  const [categoryAction, setCategoryAction] = useState<{
    category: Category;
    mode: "edit" | "delete";
  } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();
  const names = new Map(
    categories.map((category) => [category.categoryId, category.categoryName]),
  );
  const counts = new Map<string, number>();
  products.forEach((product) =>
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1),
  );
  const query = search.trim().toLocaleLowerCase("tr-TR");
  const matches = (value: string) =>
    value.toLocaleLowerCase("tr-TR").includes(query);
  const filteredProducts = products.filter(
    (product) =>
      (!categoryId || product.categoryId === categoryId) &&
      matches(
        `${product.productName} ${product.productId} ${names.get(product.categoryId) ?? ""}`,
      ),
  );
  const filteredCategories = categories.filter((category) =>
    matches(`${category.categoryName} ${category.categoryId} ${category.slug}`),
  );
  const discountedCount = products.filter(
    (product) => Number(product.productDiscount) > 0,
  ).length;
  const error = tab === "products" ? productError : categoryError;
  const visible =
    tab === "products" ? filteredProducts.length : filteredCategories.length;
  const total = tab === "products" ? products.length : categories.length;
  const refresh = () => startTransition(() => router.refresh());
  const changeTab = (value: typeof tab) => {
    setTab(value);
    setSearch("");
    setCategoryId("");
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          nest<span>®</span>
        </Link>
        <p className={styles.sidebarCaption}>YÖNETİM PANELİ</p>
        <nav className={styles.navigation} aria-label="Yönetim bölümleri">
          <button
            type="button"
            onClick={() => changeTab("products")}
            aria-pressed={tab === "products"}
            className={tab === "products" ? styles.active : ""}
          >
            <span>▦</span>Ürünler<b>{productError ? "—" : products.length}</b>
          </button>
          <button
            type="button"
            onClick={() => changeTab("categories")}
            aria-pressed={tab === "categories"}
            className={tab === "categories" ? styles.active : ""}
          >
            <span>◫</span>Kategoriler
            <b>{categoryError ? "—" : categories.length}</b>
          </button>
        </nav>
        <div className={styles.sidebarBottom}>
          <p>Her şey, iyi bir menüyle başlar.</p>
          <Link href="/">
            Menüyü görüntüle <span>↗</span>
          </Link>
        </div>
      </aside>
      <main className={styles.main} aria-busy={isPending}>
        <header className={styles.topbar}>
          <span>
            WORKSPACE <span>/</span> NEST COFFEE & KITCHEN
          </span>
          <span className={styles.mode}>Menü görünümü</span>
        </header>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>MENÜNE GENEL BİR BAKIŞ</p>
            <h1>
              Her lezzet,
              <br className={styles.mobileBreak} /> bir arada<span>.</span>
            </h1>
            <p>Kategorilerini ve ürünlerini tek bir yerden incele.</p>
          </div>
          <div className={styles.headingActions}>
            <button
              type="button"
              className={styles.refresh}
              disabled={isPending}
              onClick={() => {
                setFeedback("");
                setCreatingCategory(true);
              }}
            >
              + Kategori ekle
            </button>
            <button
              type="button"
              className={styles.addProduct}
              disabled={isPending}
              onClick={() => {
                setFeedback("");
                setCreatingProduct(true);
              }}
            >
              + Ürün ekle
            </button>
            <button
              type="button"
              className={styles.refresh}
              disabled={isPending}
              onClick={refresh}
            >
              <span className={isPending ? styles.spinning : ""}>↻</span>
              {isPending ? "Yenileniyor…" : "Verileri yenile"}
            </button>
          </div>
        </div>
        {feedback && (
          <p className={styles.successMessage} role="status">
            {feedback}
          </p>
        )}
        <section className={styles.stats} aria-label="Menü özeti">
          <div>
            <span>TOPLAM KATEGORİ</span>
            <strong>
              {categoryError
                ? "—"
                : categories.length.toString().padStart(2, "0")}
            </strong>
            <small>Menünün ana başlıkları</small>
          </div>
          <div>
            <span>TOPLAM ÜRÜN</span>
            <strong>
              {productError ? "—" : products.length.toString().padStart(2, "0")}
            </strong>
            <small>Tüm kategorilerdeki lezzetler</small>
          </div>
          <div>
            <span>İNDİRİMLİ ÜRÜN</span>
            <strong>
              {productError ? "—" : discountedCount.toString().padStart(2, "0")}
            </strong>
            <small>İndirim oranı bulunan ürünler</small>
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="admin-list-title">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.eyebrow}>MENÜ ENVANTERİ</p>
              <h2 id="admin-list-title">
                {tab === "products" ? "Ürünler" : "Kategoriler"}
                <span>{error ? "—" : total}</span>
              </h2>
            </div>
            <div className={styles.tabs}>
              <button
                type="button"
                aria-pressed={tab === "products"}
                onClick={() => changeTab("products")}
              >
                Ürünler
              </button>
              <button
                type="button"
                aria-pressed={tab === "categories"}
                onClick={() => changeTab("categories")}
              >
                Kategoriler
              </button>
            </div>
          </div>
          <div className={styles.tools}>
            <label className={styles.search}>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  tab === "products"
                    ? "Ürün adı, kod veya kategori ara…"
                    : "Kategori adı, kod veya slug ara…"
                }
                aria-label={
                  tab === "products" ? "Ürünlerde ara" : "Kategorilerde ara"
                }
              />
            </label>
            {tab === "products" && (
              <label className={styles.filter}>
                <span className="sr-only">Kategori filtresi</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={!!categoryError}
                >
                  <option value="">Tüm kategoriler</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {categoryError && tab === "products" && !productError && (
            <p className={styles.notice} role="status">
              Kategori adları alınamadı. Ürünler kategori kodlarıyla
              gösteriliyor.
            </p>
          )}
          {error ? (
            <div className={styles.empty} role="alert">
              <h3>Veriler yüklenemedi.</h3>
              <p>{error}</p>
              <button type="button" onClick={refresh} disabled={isPending}>
                Tekrar dene ↗
              </button>
            </div>
          ) : visible === 0 ? (
            <div className={styles.empty}>
              <span>∅</span>
              <h3>
                {total === 0
                  ? "Henüz kayıt yok."
                  : "Aradığın kayıt bulunamadı."}
              </h3>
              <p>
                {total === 0
                  ? "Eklenen kayıtlar burada listelenecek."
                  : "Başka bir kelime veya kategoriyle tekrar dene."}
              </p>
              {total > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryId("");
                  }}
                >
                  Filtreleri temizle ↗
                </button>
              )}
            </div>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <caption className="sr-only">
                  {tab === "products" ? "Ürün listesi" : "Kategori listesi"}
                </caption>
                <thead>
                  <tr>
                    {tab === "products" ? (
                      <>
                        <th scope="col">ÜRÜN</th>
                        <th scope="col">KATEGORİ</th>
                        <th scope="col">ÜRÜN KODU</th>
                        <th scope="col">FİYAT</th>
                        <th scope="col">İNDİRİM</th>
                        <th scope="col">İŞLEMLER</th>
                      </>
                    ) : (
                      <>
                        <th scope="col">KATEGORİ</th>
                        <th scope="col">SLUG</th>
                        <th scope="col">KATEGORİ KODU</th>
                        <th scope="col">ÜRÜN SAYISI</th>
                        <th scope="col">İŞLEMLER</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tab === "products"
                    ? filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className={styles.nameCell}>
                              <span className={styles.thumbnail}>
                                <MenuImage
                                  src={product.productImage}
                                  alt=""
                                  variant="thumbnail"
                                />
                              </span>
                              <div>
                                <strong>{product.productName}</strong>
                                <small title={product.id}>{product.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.categoryBadge}>
                              {names.get(product.categoryId) ??
                                product.categoryId}
                            </span>
                          </td>
                          <td>
                            <code>{product.productId}</code>
                          </td>
                          <td>
                            <ProductPrice
                              price={product.productPrice}
                              discount={product.productDiscount}
                            />
                          </td>
                          <td>
                            {Number(product.productDiscount) > 0 ? (
                              <span className={styles.discount}>
                                %{Number(product.productDiscount)}
                              </span>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setFeedback("");
                                  setProductAction({ product, mode: "edit" });
                                }}
                                aria-label={`${product.productName} ürününü düzenle`}
                              >
                                Düzenle ↗
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setFeedback("");
                                  setProductAction({ product, mode: "delete" });
                                }}
                                aria-label={`${product.productName} ürününü sil`}
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : filteredCategories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <div className={styles.nameCell}>
                              <span className={styles.thumbnail}>
                                <MenuImage
                                  src={category.categoryImage}
                                  alt=""
                                  variant="thumbnail"
                                />
                              </span>
                              <div>
                                <strong>{category.categoryName}</strong>
                                <small title={category.id}>{category.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code>{category.slug}</code>
                          </td>
                          <td>
                            <code>{category.categoryId}</code>
                          </td>
                          <td>
                            <span className={styles.count}>
                              {productError
                                ? "—"
                                : (counts.get(category.categoryId) ?? 0)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setFeedback("");
                                  setCategoryAction({ category, mode: "edit" });
                                }}
                                aria-label={`${category.categoryName} kategorisini düzenle`}
                              >
                                Düzenle ↗
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setFeedback("");
                                  setCategoryAction({
                                    category,
                                    mode: "delete",
                                  });
                                }}
                                aria-label={`${category.categoryName} kategorisini sil`}
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
          <div className={styles.tableFooter} aria-live="polite">
            <span>
              {isPending
                ? "Güncel veriler alınıyor…"
                : error
                  ? "Veriler kullanılamıyor"
                  : `${total} kayıttan ${visible} kayıt gösteriliyor`}
            </span>
            <span>NEST / MENÜ ENVANTERİ</span>
          </div>
        </section>
      </main>
      {creatingCategory && (
        <CategoryDialog
          mode="create"
          onClose={() => setCreatingCategory(false)}
          onSaved={(message) => {
            setCreatingCategory(false);
            setFeedback(message);
            setTab("categories");
            setSearch("");
            setCategoryId("");
            refresh();
          }}
        />
      )}
      {creatingProduct && (
        <ProductEditDialog
          mode="create"
          categories={categories}
          categoryError={categoryError}
          onClose={() => setCreatingProduct(false)}
          onSaved={(message) => {
            setCreatingProduct(false);
            setFeedback(message);
            setTab("products");
            setSearch("");
            setCategoryId("");
            refresh();
          }}
        />
      )}
      {productAction && (
        <ProductEditDialog
          key={`${productAction.mode}:${productAction.product.id}`}
          product={productAction.product}
          mode={productAction.mode}
          categories={categories}
          categoryError={categoryError}
          onClose={() => setProductAction(null)}
          onSaved={(message) => {
            setProductAction(null);
            setFeedback(message);
            refresh();
          }}
        />
      )}
      {categoryAction && (
        <CategoryDialog
          key={`${categoryAction.mode}:${categoryAction.category.id}`}
          category={categoryAction.category}
          mode={categoryAction.mode}
          productCount={
            productError
              ? undefined
              : (counts.get(categoryAction.category.categoryId) ?? 0)
          }
          onClose={() => setCategoryAction(null)}
          onSaved={(message) => {
            setCategoryAction(null);
            setFeedback(message);
            refresh();
          }}
        />
      )}
    </div>
  );
}
