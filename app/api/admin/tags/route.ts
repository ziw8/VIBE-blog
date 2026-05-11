import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  getPublicTagFields,
  getStoredTags,
  getTagsClient,
  isMissingTagsTableError,
  tagsStorageIsConfigured,
  validateTagName,
} from "@/lib/supabase-tags";

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

export async function GET() {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!tagsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  try {
    return Response.json({
      tags: await getStoredTags({ throwOnMissing: true }),
    });
  } catch (error) {
    if (isMissingTagsTableError(error as { code?: string; message?: string })) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!tagsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const supabase = getTagsClient();

  if (!supabase) {
    return setupRequiredResponse();
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

  let existingTags;

  try {
    existingTags = await getStoredTags({
      throwOnMissing: true,
    });
  } catch (error) {
    if (isMissingTagsTableError(error as { code?: string; message?: string })) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  const existingTag = existingTags.find((tag) =>
    sameTagName(tag.name, input.value),
  );

  if (existingTag) {
    return Response.json(
      { message: "이미 등록된 태그입니다." },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("post_tags")
    .insert({
      aliases: [],
      name: input.value,
    })
    .select(getPublicTagFields())
    .single();

  if (error) {
    if (isMissingTagsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json(
      { message: "태그를 추가하지 못했습니다." },
      { status: 500 },
    );
  }

  revalidateTagPages();

  return Response.json({ tag: data }, { status: 201 });
}
