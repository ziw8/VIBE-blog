import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import { validatePostDraftPayload } from "@/lib/post-editor";
import { getRegisteredPostTags } from "@/lib/posts";
import {
  draftsStorageIsConfigured,
  getDraftsClient,
  getPublicDraftFields,
  isMissingDraftsTableError,
} from "@/lib/supabase-drafts";

function adminRequiredResponse() {
  return Response.json(
    { message: "관리자 권한이 필요합니다." },
    { status: 401 },
  );
}

function setupRequiredResponse() {
  return Response.json(
    {
      setupRequired: true,
      message:
        "Supabase 임시저장 설정이 필요합니다. supabase/drafts.sql을 실행해주세요.",
    },
    { status: 503 },
  );
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function revalidateDraftPages(id?: string) {
  revalidatePath("/admin/posts");
  revalidatePath("/admin/posts/new");

  if (id) {
    revalidatePath(`/admin/posts/drafts/${id}`);
  }
}

export async function POST(request: Request) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!draftsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const supabase = getDraftsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const registeredTags = await getRegisteredPostTags();
  const input = validatePostDraftPayload(await readJson(request), registeredTags);

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .insert({
      content_html: input.value.contentHtml,
      tags: input.value.tags,
      title: input.value.title,
    })
    .select(getPublicDraftFields())
    .single();

  if (error) {
    if (isMissingDraftsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "임시 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  revalidateDraftPages(data.id);

  return Response.json({ draft: { id: data.id } }, { status: 201 });
}
