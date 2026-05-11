import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  makePostDescription,
  slugifyTitle,
  validatePostEditorPayload,
} from "@/lib/post-editor";
import { getPost, getRegisteredPostTags } from "@/lib/posts";
import {
  getPostsClient,
  getPublicPostFields,
  isMissingPostsTableError,
  postsStorageIsConfigured,
} from "@/lib/supabase-posts";
import { getDraftsClient } from "@/lib/supabase-drafts";

type PostsClient = NonNullable<ReturnType<typeof getPostsClient>>;

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
      message: "Supabase posts 테이블 설정이 필요합니다. supabase/posts.sql을 실행해주세요.",
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

function getDraftId(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const draftId = (payload as Record<string, unknown>).draftId;

  return typeof draftId === "string" && draftId ? draftId : null;
}

async function slugExists(supabase: PostsClient, slug: string) {
  if (getPost(slug)) {
    return true;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function createUniqueSlug(supabase: PostsClient, title: string) {
  const baseSlug = slugifyTitle(title);
  let slug = baseSlug;
  let suffix = 2;

  while (await slugExists(supabase, slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function revalidatePostPages(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
}

export async function POST(request: Request) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!postsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const supabase = getPostsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const registeredTags = await getRegisteredPostTags();
  const payload = await readJson(request);
  const draftId = getDraftId(payload);
  const input = validatePostEditorPayload(payload, registeredTags);

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  let slug: string;

  try {
    slug = await createUniqueSlug(supabase, input.value.title);
  } catch (error) {
    if (isMissingPostsTableError(error as { code?: string; message?: string })) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "글 주소를 만들지 못했습니다." },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug,
      title: input.value.title,
      description: makePostDescription(input.value.contentHtml),
      tags: input.value.tags,
      content_html: input.value.contentHtml,
      published_at: now,
    })
    .select(getPublicPostFields())
    .single();

  if (error) {
    if (isMissingPostsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "글을 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  revalidatePostPages(data.slug);
  revalidatePath("/admin/posts/new");

  if (draftId) {
    await getDraftsClient()?.from("post_drafts").delete().eq("id", draftId);
  }

  return Response.json({ post: { slug: data.slug } }, { status: 201 });
}
