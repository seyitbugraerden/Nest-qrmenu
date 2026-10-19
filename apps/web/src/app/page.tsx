"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import MenuLoader from "@/components/menu-loader";

const categories = [
  "Tümü",
  "Kahveler",
  "Soğuk içecekler",
  "Tatlılar",
  "Atıştırmalıklar",
];

// Tasarım verileri. API bağlantısı sonraki adımda eklenecek.
const products = [
  {
    id: "1",
    name: "Flat White",
    category: "Kahveler",
    description:
      "Çift shot espresso, ipeksi süt. Küçük bir fincanda büyük bir mola.",
    price: 145,
    tag: "Çok sevilen",
    art: "coffee",
  },
  {
    id: "2",
    name: "Iced Latte",
    category: "Soğuk içecekler",
    description: "Taze espresso, soğuk süt ve bol buz. Günün en ferah eşliği.",
    price: 165,
    tag: "",
    art: "iced",
  },
  {
    id: "3",
    name: "San Sebastian",
    category: "Tatlılar",
    description: "Karamelize dışı, yumuşacık içi. Yanında çikolata sosuyla.",
    price: 240,
    tag: "Ev yapımı",
    art: "cake",
  },
  {
    id: "4",
    name: "Filtre Kahve",
    category: "Kahveler",
    description:
      "Mevsimsel çekirdeklerden, her fincanda dengeli ve temiz bir tat.",
    price: 120,
    tag: "",
    art: "filter",
  },
  {
    id: "5",
    name: "Ev Yapımı Limonata",
    category: "Soğuk içecekler",
    description:
      "Taze limon, bir dokunuş nane. Tam kararında tatlı, bolca ferah.",
    price: 135,
    tag: "",
    art: "lemon",
  },
  {
    id: "6",
    name: "Mozzarella Sandviç",
    category: "Atıştırmalıklar",
    description: "Ekşi mayalı ekmek, mozzarella, domates ve fesleğenli pesto.",
    price: 275,
    tag: "Taze hazırlanır",
    art: "sandwich",
  },
];

function ProductArt({ kind }: { kind: string }) {
  return (
    <div className={`product-art art-${kind}`} aria-hidden="true">
      <span className="art-shadow" />
      <span className="art-object" />
      <span className="art-detail" />
    </div>
  );
}

export default function Home() {
  const [category, setCategory] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [intro, setIntro] = useState(true);
  const [selected, setSelected] = useState<(typeof products)[number] | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(() => setIntro(false), reduced ? 0 : 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!intro) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIntro(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [intro]);

  useEffect(() => {
    const root = contentRef.current;
    if (intro || !root || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("reveal-ready");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [intro]);

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
  }, [selected]);

  const filtered = products.filter(
    (product) =>
      (category === "Tümü" || product.category === category) &&
      `${product.name} ${product.description} ${product.category}`
        .toLocaleLowerCase("tr-TR")
        .includes(search.trim().toLocaleLowerCase("tr-TR")),
  );

  return (
    <>
      {intro && <MenuLoader intro onSkip={() => setIntro(false)} />}
      <div
        className={`menu-page ${intro ? "is-intro" : "is-ready"}`}
        ref={contentRef}
        inert={intro}
      >
        <header className="topbar">
          <a className="brand" href="#" aria-label="Nest ana sayfa">
            nest<span>®</span>
          </a>
          <span className="topbar-note">
            <span className="status-dot" /> COFFEE & KITCHEN
          </span>
          <a className="header-link" href="#menu">
            MENÜYE GÖZ AT <span>↗</span>
          </a>
        </header>

        <main>
          <section className="hero" aria-labelledby="welcome-title">
            <div className="hero-copy">
              <p className="eyebrow hero-enter">ACELEYE BİRAZ ARA.</p>
              <h1 id="welcome-title">
                <span className="title-line">
                  <span>Bir yudum.</span>
                </span>
                <span className="title-line">
                  <span>
                    Bir <i>iyi his.</i>
                  </span>
                </span>
              </h1>
              <div className="hero-bottom hero-enter">
                <p>
                  Kahven burada. Keyfin yerinde.
                  <br />
                  Günün geri kalanı biraz bekleyebilir.
                </p>
                <a
                  className="round-link"
                  href="#menu"
                  aria-label="Menüyü keşfet"
                >
                  <span>↘</span>
                </a>
              </div>
            </div>
            <div className="hero-visual hero-enter" aria-hidden="true">
              <div className="visual-grid" />
              <span className="visual-index">N° 01 — THE DAILY RITUAL</span>
              <div className="hero-saucer">
                <div className="hero-cup">
                  <div className="coffee-surface">
                    <span>✳</span>
                  </div>
                </div>
              </div>
              <span className="floating-label">a little cup of joy.</span>
              <span className="hero-stamp">
                FRESHLY
                <br />
                <strong>brewed</strong>
                <br />
                JUST FOR YOU
              </span>
              <div className="visual-caption">
                <span>ÖZENLE DEMLENDİ.</span>
                <span>SEVGİYLE SUNULDU. ↗</span>
              </div>
            </div>
            <div className="hero-footer">
              <span>GÜZEL ŞEYLER İÇİN DOĞRU YERDESİN.</span>
              <span>SCROLL TO TASTE ↓</span>
            </div>
          </section>

          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[0, 1, 2, 3].map((item) => (
                <span key={item}>
                  GOOD COFFEE <i>✳</i> GOOD FOOD <i>✳</i> GOOD MOOD{" "}
                  <i>✳</i>{" "}
                </span>
              ))}
            </div>
          </div>

          <section
            className="menu-section"
            id="menu"
            aria-labelledby="menu-title"
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
              <nav className="categories" aria-label="Menü kategorileri">
                {categories.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item ? "category active" : "category"
                    }
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    <sup>0{index + 1}</sup>
                    {item}
                    <span className="category-dot">↗</span>
                  </button>
                ))}
              </nav>
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
                  <path
                    d="m16 16 5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
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
                {category === "Tümü"
                  ? "TÜM LEZZETLER"
                  : category.toLocaleUpperCase("tr-TR")}
              </span>
              <span>{String(filtered.length).padStart(2, "0")} SEÇENEK</span>
            </div>
            <div className="product-grid" key={`${category}:${search}`}>
              {filtered.map((product, index) => (
                <button
                  type="button"
                  className="product-card"
                  key={product.id}
                  style={{ "--card-index": index } as CSSProperties}
                  onClick={() => setSelected(product)}
                  aria-label={`${product.name}, ${product.price} Türk lirası. Detayları gör`}
                >
                  <div className="product-image">
                    <ProductArt kind={product.art} />
                    <span className="product-number">/ 0{product.id}</span>
                    {product.tag && (
                      <span className="product-tag">{product.tag}</span>
                    )}
                    <span className="card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <div className="product-content">
                    <span className="product-category">{product.category}</span>
                    <div className="product-title">
                      <h3>{product.name}</h3>
                      <span className="price">
                        {product.price}
                        <small>₺</small>
                      </span>
                    </div>
                    <p>{product.description}</p>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="empty-state">
                <span>↗</span>
                <h3>Başka bir tat deneyelim mi?</h3>
                <p>Bu aramada bir sonuç bulamadık.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("Tümü");
                  }}
                >
                  Tüm menüye dön ↗
                </button>
              </div>
            )}
            <aside className="allergen-note" data-reveal>
              <span aria-hidden="true">✳</span>
              <div>
                <h3>İyi hissetmen önemli.</h3>
                <p>
                  Alerjenler ve içerikler hakkında ekibimize danışabilirsin.
                </p>
              </div>
              <span className="note-index">WITH CARE, ALWAYS.</span>
            </aside>
          </section>
        </main>
        <footer>
          <div className="footer-top">
            <p>
              Bir dahaki
              <br />
              <i>molaya kadar.</i>
            </p>
            <a href="#" className="back-top" aria-label="Sayfanın başına dön">
              ↑
            </a>
          </div>
          <div className="footer-bottom">
            <a className="footer-brand" href="#">
              nest®
            </a>
            <span>COFFEE, FOOD & GOOD MOOD.</span>
            <span>ÖRNEK MENÜ / TASARIM ÖN İZLEMESİ</span>
          </div>
        </footer>
      </div>
      <dialog
        ref={dialogRef}
        className="product-dialog"
        aria-labelledby="product-detail-title"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        {selected && (
          <>
            <button
              type="button"
              className="dialog-close"
              aria-label="Ürün detayını kapat"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
            <div className="dialog-art">
              <ProductArt kind={selected.art} />
            </div>
            <div className="dialog-copy">
              <p className="eyebrow">{selected.category}</p>
              <div className="product-title">
                <h2 id="product-detail-title">{selected.name}</h2>
                <span className="price">{selected.price} ₺</span>
              </div>
              <p>{selected.description}</p>
              <span className="dialog-note">
                İçerik ve alerjen bilgisi için ekibimize danışabilirsin.
              </span>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
