import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPostEditor } from "@/components/admin-post-editor";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { getRegisteredPostTags } from "@/lib/posts";
import { getStoredDraft } from "@/lib/supabase-drafts";

type AdminDraftEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Draft Post",
  description: "임시저장 글 수정 페이지입니다.",
};

export default async function AdminDraftEditPage({
  params,
}: AdminDraftEditPageProps) {
  if (!(await adminIsAuthenticated())) {
    notFound();
  }

  const { id } = await params;
  const draft = await getStoredDraft(id);

  if (!draft) {
    notFound();
  }

  const tags = await getRegisteredPostTags();

  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <div className="space-y-2">
            <p className="text-sm text-black/50 dark:text-white/50">
              임시저장
            </p>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {draft.title || "제목 없음"}
            </h1>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AdminPostEditor
            draft={{
              contentHtml: draft.content_html,
              id: draft.id,
              tags: draft.tags,
              title: draft.title,
            }}
            tags={tags}
          />
        </Reveal>
      </div>
    </Container>
  );
}
