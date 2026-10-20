"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  apiBase,
  assertSameOrigin,
  cookieOptions,
} from "@/lib/admin-auth";

export type LoginState = { error: string };

export async function loginAction(
  _state: LoginState,
  form: FormData,
): Promise<LoginState> {
  await assertSameOrigin();
  const email = form.get("email");
  const password = form.get("password");
  const code = form.get("code");
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length > 256 ||
    typeof code !== "string" ||
    code.length > 80
  )
    return { error: "Giriş bilgileri geçerli değil." };
  try {
    const response = await fetch(`${apiBase()}/auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, code }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      return {
        error:
          response.status === 429
            ? "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin."
            : response.status === 401
              ? "Giriş bilgileri veya doğrulama kodu geçersiz."
              : "Giriş servisine ulaşılamıyor. Lütfen tekrar deneyin.",
      };
    const data = await response.json();
    if (
      typeof data.token !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(data.token) ||
      !Number.isFinite(Date.parse(data.expiresAt))
    )
      throw new Error();
    (await cookies()).set(ADMIN_COOKIE, data.token, {
      ...cookieOptions,
      expires: new Date(data.expiresAt),
    });
  } catch {
    return { error: "Giriş servisine ulaşılamıyor. Lütfen tekrar deneyin." };
  }
  redirect("/admin");
}

export async function logoutAction(form: FormData) {
  await assertSameOrigin();
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const all = form.get("all") === "true";
  if (token) {
    try {
      const response = await fetch(
        `${apiBase()}/auth/${all ? "logout-all" : "logout"}`,
        {
          method: "POST",
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!response.ok && response.status !== 401) throw new Error();
    } catch {
      redirect("/admin?authError=logout");
    }
  }
  store.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  redirect("/admin/login");
}
