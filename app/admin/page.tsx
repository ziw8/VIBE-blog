import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Admin",
  description: "관리자 전용 페이지입니다.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    notFound();
  }

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="space-y-2">
            <p className="text-sm text-black/50 dark:text-white/50">
              관리자
            </p>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              글 관리
            </h1>
            <p className="text-black/60 dark:text-white/60">
              글쓰기와 글 관리는 다음 단계에서 이곳에 붙일 예정입니다.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <section className="space-y-2">
            <h2 className="font-semibold text-black dark:text-white">
              현재 로그인
            </h2>
            <p className="text-black/75 dark:text-white/90">
              {session.user.email ?? session.user.githubLogin ?? session.user.name}
            </p>
            <form
              action={async () => {
                "use server";

                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-black/40 underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:text-black hover:decoration-black/25 dark:text-white/40 dark:decoration-white/30 dark:hover:text-white dark:hover:decoration-white/50"
              >
                Sign out
              </button>
            </form>
          </section>
        </Reveal>
      </div>
    </Container>
  );
}
