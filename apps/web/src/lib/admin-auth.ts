import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-nest-admin" : "nest-admin";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
export const apiBase = () =>
  (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");

// Native Server Actions Origin kontrolüne ilave olarak hassas işlemleri doğrula.
export async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  if (!origin || !host) throw new Error("Geçersiz istek kaynağı.");
  const configured = process.env.APP_ORIGIN;
  if (configured) {
    if (new URL(origin).origin !== new URL(configured).origin)
      throw new Error("Geçersiz istek kaynağı.");
  } else if (new URL(origin).host !== host)
    throw new Error("Geçersiz istek kaynağı.");
}

export async function adminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const response = await fetch(`${apiBase()}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Oturum doğrulanamadı.");
  const data = await response.json();
  if (!data?.admin?.email || !data?.admin?.id)
    throw new Error("Geçersiz oturum yanıtı.");
  return {
    token,
    admin: { id: String(data.admin.id), email: String(data.admin.email) },
  };
}

export async function requireAdmin() {
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function adminActionAuthorization() {
  await assertSameOrigin();
  const session = await requireAdmin();
  return { Authorization: `Bearer ${session.token}` };
}
