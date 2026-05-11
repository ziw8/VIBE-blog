import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "관리자 인증 페이지입니다.",
};

export default async function AdminLoginPage() {
  if (await adminIsAuthenticated()) {
    redirect("/admin");
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm space-y-8">
        <Reveal>
          <div className="space-y-2">
            <p className="text-sm text-black/50 dark:text-white/50">Admin</p>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              관리자 인증
            </h1>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminLoginForm />
        </Reveal>
      </div>
    </Container>
  );
}
