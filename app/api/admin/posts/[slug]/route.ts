import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  makePostDescription,
  validatePostEditorPayload,
} from "@/lib/post-editor";
import { getPost, getPublishedPostTags } from "@/lib/posts";
import {
  getPostsClient,
  getPublicPostFields,
  isMissingPostsTableError,
  postsStorageIsConfigured,
} from "@/lib/supabase-posts";

type AdminPostRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

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

function revalidatePostPages(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
}

export async function PATCH(
  request: Request,
  { params }: AdminPostRouteContext,
) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!postsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const { slug } = await params;
  const supabase = getPostsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const existing = await supabase
    .from("posts")
    .select(getPublicPostFields())
    .eq("slug", slug)
    .maybeSingle();

  if (existing.error) {
    if (isMissingPostsTableError(existing.error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "글을 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (existing.data?.deleted_at) {
    return Response.json({ message: "글을 찾지 못했습니다." }, { status: 404 });
  }

  const registeredTags = await getPublishedPostTags();
  const input = validatePostEditorPayload(await readJson(request), registeredTags);

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  if (!existing.data) {
    const staticPost = getPost(slug);

    if (!staticPost) {
      return Response.json(
        { message: "글을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        slug: staticPost.slug,
        title: input.value.title,
        description: makePostDescription(input.value.contentHtml),
        tags: input.value.tags,
        content_html: input.value.contentHtml,
        published_at: new Date(`${staticPost.date}T00:00:00`).toISOString(),
      })
      .select(getPublicPostFields())
      .single();

    if (error) {
      if (isMissingPostsTableError(error)) {
        return setupRequiredResponse();
      }

      return Response.json(
        { message: "글을 수정하지 못했습니다." },
        { status: 500 },
      );
    }

    revalidatePostPages(data.slug);

    return Response.json({ post: { slug: data.slug } });
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      title: input.value.title,
      description: makePostDescription(input.value.contentHtml),
      tags: input.value.tags,
      content_html: input.value.contentHtml,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.data.id)
    .select(getPublicPostFields())
    .single();

  if (error) {
    return Response.json(
      { message: "글을 수정하지 못했습니다." },
      { status: 500 },
    );
  }

  revalidatePostPages(data.slug);

  return Response.json({ post: { slug: data.slug } });
}

export async function DELETE(
  _request: Request,
  { params }: AdminPostRouteContext,
) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!postsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const { slug } = await params;
  const supabase = getPostsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const existing = await supabase
    .from("posts")
    .select(getPublicPostFields())
    .eq("slug", slug)
    .maybeSingle();

  if (existing.error) {
    if (isMissingPostsTableError(existing.error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "글을 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (!existing.data) {
    const staticPost = getPost(slug);

    if (!staticPost) {
      return Response.json(
        { message: "글을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from("posts").insert({
      slug: staticPost.slug,
      title: staticPost.title,
      description: staticPost.description,
      tags: staticPost.tags,
      content_html: staticPost.contentHtml ?? "",
      published_at: new Date(`${staticPost.date}T00:00:00`).toISOString(),
      deleted_at: deletedAt,
    });

    if (error) {
      return Response.json(
        { message: "글을 삭제하지 못했습니다." },
        { status: 500 },
      );
    }

    revalidatePostPages(staticPost.slug);

    return Response.json({ ok: true });
  }

  if (existing.data.deleted_at) {
    return Response.json({ ok: true });
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.data.id)
    .select("slug")
    .single();

  if (error) {
    if (isMissingPostsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "글을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }

  revalidatePostPages(data.slug);

  return Response.json({ ok: true });
}
