"use client";

import { useEffect, useRef, useState } from "react";
import MenuLoader from "@/components/menu-loader";
import type { MenuViewProps } from "@/types/menu";
import MenuSection from "./menu-section";

export default function MenuView({
  categories,
  categorySlug = null,
  products,
  isLoading = false,
  error = null,
  onRetry,
}: MenuViewProps) {
  const [intro, setIntro] = useState(true);
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

          <MenuSection
            categories={categories}
            categorySlug={categorySlug}
            products={products}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
          />
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
            <span>COFFEE & KITCHEN / DİJİTAL MENÜ</span>
          </div>
        </footer>
      </div>
    </>
  );
}
