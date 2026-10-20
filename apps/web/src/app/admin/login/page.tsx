import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/admin-auth";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Nest | Yönetici Girişi",
  robots: { index: false, follow: false },
};
async function Login() {
  await connection();
  // API kesintisinde de giriş formunu erişilebilir bırak; yetkiyi açma.
  const session = await adminSession().catch(() => null);
  if (session) redirect("/admin");
  return <LoginForm />;
}
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p role="status" style={{ padding: "40px" }}>
          Giriş hazırlanıyor…
        </p>
      }
    >
      <Login />
    </Suspense>
  );
}
