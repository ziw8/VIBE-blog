import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  getPublicTagFields,
  getStoredTag,
  getStoredTags,
  getTagsClient,
  isMissingTagsTableError,
  tagsStorageIsConfigured,
  validateTagName,
} from "@/lib/supabase-tags";

type AdminTagRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TagsClient = NonNullable<ReturnType<typeof getTagsClient>>;

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
      message: "Supabase 태그 설정이 필요합니다. supabase/tags.sql을 실행해주세요.",
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

function revalidateTagPages() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/posts/new");
}

function sameTagName(left: string, right: string) {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

function uniqueTags(values: string[]) {
  return Array.from(new Set(values));
}

async function replacePostTags(
  supabase: TagsClient,
  previousNames: string[],
  nextName: string,
) {
  const previousNameSet = new Set(
    previousNames.map((name) => name.toLocaleLowerCase()),
  );
  const { data, error } = await supabase.from("posts").select("id, tags");

  if (error) {
    throw error;
  }

  await Promise.all(
    data.map((post) => {
      const nextTags = uniqueTags(
        post.tags.map((tag) =>
          previousNameSet.has(tag.toLocaleLowerCase()) ? nextName : tag,
        ),
      );

      if (nextTags.join("\u0000") === post.tags.join("\u0000")) {
        return Promise.resolve();
      }

      return supabase.from("posts").update({ tags: nextTags }).eq("id", post.id);
    }),
  );
}

async function removePostTags(supabase: TagsClient, tagNames: string[]) {
  const tagNameSet = new Set(tagNames.map((name) => name.toLocaleLowerCase()));
  const { data, error } = await supabase.from("posts").select("id, tags");

  if (error) {
    throw error;
  }

  await Promise.all(
    data.map((post) => {
      const nextTags = post.tags.filter(
        (tag) => !tagNameSet.has(tag.toLocaleLowerCase()),
      );

      if (nextTags.join("\u0000") === post.tags.join("\u0000")) {
        return Promise.resolve();
      }

      return supabase.from("posts").update({ tags: nextTags }).eq("id", post.id);
    }),
  );
}

export async function PATCH(
  request: Request,
  { params }: AdminTagRouteContext,
) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!tagsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const { id } = await params;
  const supabase = getTagsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  let tag;

  try {
    tag = await getStoredTag(id);
  } catch (error) {
    if (isMissingTagsTableError(error as { code?: string; message?: string })) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (!tag) {
    return Response.json({ message: "태그를 찾지 못했습니다." }, { status: 404 });
  }

  const payload = await readJson(request);
  const input = validateTagName(
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).name
      : null,
  );

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  const existingTags = await getStoredTags({
    throwOnMissing: true,
  });
  const duplicate = existingTags.find(
    (item) =>
      item.id !== tag.id &&
      sameTagName(item.name, input.value),
  );

  if (duplicate) {
    return Response.json(
      { message: "이미 등록된 태그입니다." },
      { status: 409 },
    );
  }

  const isSameName = sameTagName(tag.name, input.value);
  const aliases = isSameName ? tag.aliases : uniqueTags([...tag.aliases, tag.name]);

  const { data, error } = await supabase
    .from("post_tags")
    .update({
      aliases,
      name: input.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tag.id)
    .select(getPublicTagFields())
    .single();

  if (error) {
    return Response.json(
      { message: "태그를 수정하지 못했습니다." },
      { status: 500 },
    );
  }

  if (!isSameName) {
    try {
      await replacePostTags(supabase, [tag.name, ...tag.aliases], input.value);
    } catch {
      return Response.json(
        { message: "게시글 태그를 갱신하지 못했습니다." },
        { status: 500 },
      );
    }
  }

  revalidateTagPages();

  return Response.json({ tag: data });
}

export async function DELETE(
  _request: Request,
  { params }: AdminTagRouteContext,
) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!tagsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const { id } = await params;
  const supabase = getTagsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  let tag;

  try {
    tag = await getStoredTag(id);
  } catch (error) {
    if (isMissingTagsTableError(error as { code?: string; message?: string })) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (!tag) {
    return Response.json({ message: "태그를 찾지 못했습니다." }, { status: 404 });
  }

  try {
    await removePostTags(supabase, [tag.name, ...tag.aliases]);
  } catch {
    return Response.json(
      { message: "게시글 태그를 갱신하지 못했습니다." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("post_tags")
    .delete()
    .eq("id", tag.id)
    .select(getPublicTagFields())
    .maybeSingle();

  if (error) {
    if (isMissingTagsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 삭제하지 못했습니다." },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json({ message: "태그를 찾지 못했습니다." }, { status: 404 });
  }

  revalidateTagPages();

  return Response.json({ tag: data });
}
