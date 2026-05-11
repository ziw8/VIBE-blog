import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";

const adminSections = [
  {
    href: "/admin/posts",
    title: "글쓰기",
  },
  {
    href: "/admin/tags",
    title: "태그 관리",
  },
  {
    href: "/admin/home",
    title: "첫 페이지 관리",
  },
];

export const metadata: Metadata = {
  title: "Admin",
  description: "관리자 전용 페이지입니다.",
};

export default async function AdminPage() {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-black/50 dark:text-white/50">
                관리자
              </p>
              <h1 className="text-2xl font-semibold text-black dark:text-white">
                관리 페이지
              </h1>
            </div>
            <AdminLogoutButton />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid gap-5 sm:grid-cols-3">
            {adminSections.map((section) => (
              <section
                key={section.title}
                className="border-t border-black/10 pt-4 dark:border-white/15"
              >
                <Link
                  href={section.href}
                  className="font-semibold text-black underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:decoration-black/35 dark:text-white dark:decoration-white/30 dark:hover:decoration-white/50"
                >
                  {section.title}
                </Link>
              </section>
            ))}
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
