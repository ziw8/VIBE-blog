import { type NextRequest } from "next/server";
import { validateCreateComment } from "@/lib/comment-validation";
import {
  commentsAreConfigured,
  getCommentsClient,
  getLegacyPublicCommentFields,
  getPublicCommentFields,
  hashCommentPassword,
  isMissingParentIdError,
  toPublicComment,
} from "@/lib/supabase-comments";

function setupResponse() {
  return Response.json(
    {
      setupRequired: true,
      comments: [],
      message: "Supabase 댓글 설정이 필요합니다.",
    },
    { status: 503 },
  );
}

function migrationResponse() {
  return Response.json(
    {
      migrationRequired: true,
      message: "답글 기능을 켜려면 Supabase 댓글 SQL을 다시 실행해주세요.",
    },
    { status: 409 },
  );
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const postSlug = request.nextUrl.searchParams.get("postSlug")?.trim();

  if (!postSlug) {
    return Response.json(
      { message: "게시글 정보를 다시 확인해주세요." },
      { status: 400 },
    );
  }

  if (!commentsAreConfigured()) {
    return setupResponse();
  }

  const supabase = getCommentsClient();

  if (!supabase) {
    return setupResponse();
  }

  const { data, error } = await supabase
    .from("comments")
    .select(getPublicCommentFields())
    .eq("post_slug", postSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingParentIdError(error)) {
      const legacy = await supabase
        .from("comments")
        .select(getLegacyPublicCommentFields())
        .eq("post_slug", postSlug)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (legacy.error) {
        return Response.json(
          { message: "댓글을 불러오지 못했습니다." },
          { status: 500 },
        );
      }

      return Response.json({
        migrationRequired: true,
        comments: legacy.data.map(toPublicComment),
      });
    }

    return Response.json(
      { message: "댓글을 불러오지 못했습니다." },
      { status: 500 },
    );
  }

  return Response.json({
    comments: data.map(toPublicComment),
  });
}

export async function POST(request: Request) {
  if (!commentsAreConfigured()) {
    return setupResponse();
  }

  const payload = await readJson(request);
  const input = validateCreateComment(payload);

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  const supabase = getCommentsClient();

  if (!supabase) {
    return setupResponse();
  }

  if (input.value.parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("comments")
      .select("id, parent_id")
      .eq("id", input.value.parentId)
      .eq("post_slug", input.value.postSlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (parentError) {
      if (isMissingParentIdError(parentError)) {
        return migrationResponse();
      }

      return Response.json(
        { message: "답글을 달 댓글을 확인하지 못했습니다." },
        { status: 500 },
      );
    }

    if (!parent) {
      return Response.json(
        { message: "답글을 달 댓글을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    if (parent.parent_id) {
      return Response.json(
        { message: "답글에는 답글을 달 수 없습니다." },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_slug: input.value.postSlug,
      parent_id: input.value.parentId,
      nickname: input.value.nickname,
      body: input.value.body,
      emoji: input.value.emoji,
      password_hash: hashCommentPassword(input.value.password),
    })
    .select(getPublicCommentFields())
    .single();

  if (error) {
    if (isMissingParentIdError(error)) {
      if (input.value.parentId) {
        return migrationResponse();
      }

      const legacy = await supabase
        .from("comments")
        .insert({
          post_slug: input.value.postSlug,
          nickname: input.value.nickname,
          body: input.value.body,
          emoji: input.value.emoji,
          password_hash: hashCommentPassword(input.value.password),
        })
        .select(getLegacyPublicCommentFields())
        .single();

      if (!legacy.error) {
        return Response.json(
          { comment: toPublicComment(legacy.data), migrationRequired: true },
          { status: 201 },
        );
      }
    }

    return Response.json(
      { message: "댓글을 저장하지 못했습니다." },
      { status: 500 },
    );
  }

  return Response.json({ comment: toPublicComment(data) }, { status: 201 });
}
