"use client";

import { useState } from "react";
import type { MenuProduct, MenuViewProps } from "@/types/menu";
import CategoryList from "./category-list";
import ProductList from "./product-list";
import ProductDialog from "./product-dialog";

export default function MenuSection({
  categories,
  products,
  isLoading = false,
  error = null,
  onRetry,
}: MenuViewProps) {
  const [selectedCategoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProductId, setProductId] = useState<string | null>(null);
  const categoryNames = new Map(
    categories.map((item) => [item.categoryId, item.categoryName]),
  );
  // Veriler yenilendiğinde kaldırılan kategori seçimi tüm listeye döner.
  const activeCategoryId = categories.some(
    (item) => item.categoryId === selectedCategoryId,
  )
    ? selectedCategoryId
    : null;
  const filtered = products.filter(
    (product) =>
      (activeCategoryId === null || product.categoryId === activeCategoryId) &&
      `${product.productName} ${product.description ?? ""} ${categoryNames.get(product.categoryId) ?? product.categoryName ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(search.trim().toLocaleLowerCase("tr-TR")),
  );
  const selected =
    !isLoading && !error
      ? (products.find((product) => product.id === selectedProductId) ?? null)
      : null;
  const reset = () => {
    setSearch("");
    setCategoryId(null);
  };
  const selectProduct = (product: MenuProduct) => setProductId(product.id);

  return (
    <section
      className="menu-section"
      id="menu"
      aria-labelledby="menu-title"
      aria-busy={isLoading}
    >
      <div className="section-heading" data-reveal>
        <div>
          <p className="eyebrow">01 / CANIN NE ÇEKİYOR?</p>
          <h2 id="menu-title">
            Senin <i>favorin.</i>
          </h2>
        </div>
        <p>
          Her zevke bir şey.
          <br />
          Her molaya bir bahane.
        </p>
      </div>
      <div className="menu-tools">
        <CategoryList
          categories={categories}
          selectedCategoryId={activeCategoryId}
          onSelect={setCategoryId}
        />
        <label className="search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10.5"
              cy="10.5"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            type="search"
            aria-label="Menüde ara"
            placeholder="Bir lezzet ara…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <div className="results-line" aria-live="polite">
        <span>
          {activeCategoryId === null
            ? "TÜM LEZZETLER"
            : categoryNames.get(activeCategoryId)?.toLocaleUpperCase("tr-TR")}
        </span>
        <span>
          {isLoading
            ? "YÜKLENİYOR…"
            : error
              ? ""
              : `${String(filtered.length).padStart(2, "0")} SEÇENEK`}
        </span>
      </div>
      {isLoading ? (
        <div role="status">
          <span className="sr-only">Menü yükleniyor</span>
          <div className="product-grid" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div className="menu-skeleton" key={index}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <h3>Menüye ulaşılamıyor.</h3>
          <p>{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Tekrar dene ↗
            </button>
          )}
        </div>
      ) : filtered.length > 0 ? (
        <ProductList
          key={`${activeCategoryId}:${search}`}
          products={filtered}
          categories={categories}
          onSelect={selectProduct}
        />
      ) : (
        <div className="empty-state">
          <span>↗</span>
          <h3>
            {products.length === 0
              ? "Menümüz yakında burada."
              : "Başka bir tat deneyelim mi?"}
          </h3>
          <p>
            {products.length === 0
              ? "Yeni lezzetler için tekrar uğra."
              : "Bu aramada bir sonuç bulamadık."}
          </p>
          {(activeCategoryId !== null || search) && (
            <button type="button" onClick={reset}>
              Tüm menüye dön ↗
            </button>
          )}
        </div>
      )}
      <aside className="allergen-note" data-reveal>
        <span aria-hidden="true">✳</span>
        <div>
          <h3>İyi hissetmen önemli.</h3>
          <p>Alerjenler ve içerikler hakkında ekibimize danışabilirsin.</p>
        </div>
        <span className="note-index">WITH CARE, ALWAYS.</span>
      </aside>
      <ProductDialog
        product={selected}
        categoryName={
          selected
            ? (categoryNames.get(selected.categoryId) ??
              selected.categoryName ??
              "Menümüz")
            : ""
        }
        onClose={() => setProductId(null)}
      />
    </section>
  );
}
