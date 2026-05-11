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
    description: "새 글 작성과 게시글 목록을 관리합니다.",
  },
  {
    href: "/admin",
    title: "첫 페이지 관리",
    description: "소개글, About, Contacts 문구를 관리할 예정입니다.",
  },
  {
    href: "/admin",
    title: "태그 관리",
    description: "태그 추가, 제외, 이름 수정을 글쓰기 기능과 연결합니다.",
  },
  {
    href: "/admin",
    title: "댓글 관리",
    description: "댓글과 답글을 확인하고 관리자 권한으로 삭제합니다.",
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
              <p className="text-black/60 dark:text-white/60">
                글, 첫 페이지, 태그, 댓글 관리를 이곳에 차례로 붙입니다.
              </p>
            </div>
            <AdminLogoutButton />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid gap-5 sm:grid-cols-2">
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
                <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">
                  {section.description}
                </p>
              </section>
            ))}
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
