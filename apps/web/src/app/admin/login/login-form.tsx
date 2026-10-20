"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import styles from "./login.module.css";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <Link href="/" className={styles.brand}>
          nest<span>®</span>
        </Link>
        <p className={styles.eyebrow}>YÖNETİCİ ERİŞİMİ</p>
        <h1 id="login-title">
          Yeniden
          <br />
          <i>hoş geldin.</i>
        </h1>
        <p className={styles.description}>
          Menünü yönetmek için hesabınla giriş yap.
        </p>
        <form action={action} aria-busy={pending}>
          <fieldset disabled={pending}>
            <label>
              E-posta
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                autoFocus
              />
            </label>
            <label>
              Şifre
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </label>
            <label>
              Doğrulama veya kurtarma kodu
              <input
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength={80}
                spellCheck={false}
                placeholder="6 haneli uygulama kodu"
              />
              <small>
                Doğrulama uygulamasındaki kodu veya tek kullanımlık kurtarma
                kodunu gir.
              </small>
            </label>
          </fieldset>
          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending}>
            {pending ? "Doğrulanıyor…" : "Güvenli giriş yap ↗"}
          </button>
        </form>
        <Link href="/" className={styles.back}>
          ← Menüye dön
        </Link>
        <p className={styles.footnote}>Yalnızca yetkili yönetici erişebilir.</p>
      </section>
      <div className={styles.art} aria-hidden="true">
        <span>
          good coffee.
          <br />
          good food.
          <br />
          <i>good control.</i>
        </span>
        <b>✳</b>
        <small>NEST / COFFEE & KITCHEN</small>
      </div>
    </main>
  );
}
