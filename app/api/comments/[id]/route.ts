import { validatePassword, validateUpdateComment } from "@/lib/comment-validation";
import {
  commentsAreConfigured,
  getCommentsClient,
  getLegacyPublicCommentFields,
  getPublicCommentFields,
  isMissingParentIdError,
  toPublicComment,
  verifyCommentPassword,
  verifyCommentManagementPassword,
} from "@/lib/supabase-comments";

type CommentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function setupResponse() {
  return Response.json(
    {
      setupRequired: true,
      message: "Supabase 댓글 설정이 필요합니다.",
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

async function getStoredPasswordHash(id: string) {
  const supabase = getCommentsClient();

  if (!supabase) {
    return {
      setupRequired: true,
      passwordHash: null,
    };
  }

  const { data, error } = await supabase
    .from("comments")
    .select("password_hash")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    setupRequired: false,
    passwordHash: data?.password_hash ?? null,
  };
}

export async function PATCH(request: Request, { params }: CommentRouteContext) {
  if (!commentsAreConfigured()) {
    return setupResponse();
  }

  const { id } = await params;
  const payload = await readJson(request);
  const input = validateUpdateComment(payload);

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  let stored;

  try {
    stored = await getStoredPasswordHash(id);
  } catch {
    return Response.json(
      { message: "댓글을 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (stored.setupRequired) {
    return setupResponse();
  }

  if (!stored.passwordHash) {
    return Response.json({ message: "댓글을 찾지 못했습니다." }, { status: 404 });
  }

  if (!verifyCommentPassword(input.value.password, stored.passwordHash)) {
    return Response.json(
      { message: "비밀번호가 일치하지 않습니다." },
      { status: 403 },
    );
  }

  const supabase = getCommentsClient();

  if (!supabase) {
    return setupResponse();
  }

  const { data, error } = await supabase
    .from("comments")
    .update({
      body: input.value.body,
      emoji: input.value.emoji,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(getPublicCommentFields())
    .single();

  if (error) {
    if (isMissingParentIdError(error)) {
      const legacy = await supabase
        .from("comments")
        .update({
          body: input.value.body,
          emoji: input.value.emoji,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .is("deleted_at", null)
        .select(getLegacyPublicCommentFields())
        .single();

      if (!legacy.error) {
        return Response.json({
          comment: toPublicComment(legacy.data),
          migrationRequired: true,
        });
      }
    }

    return Response.json(
      { message: "댓글을 수정하지 못했습니다." },
      { status: 500 },
    );
  }

  return Response.json({ comment: toPublicComment(data) });
}

export async function DELETE(request: Request, { params }: CommentRouteContext) {
  if (!commentsAreConfigured()) {
    return setupResponse();
  }

  const { id } = await params;
  const payload = await readJson(request);
  const password = validatePassword(
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).password
      : null,
  );

  if (!password.ok) {
    return Response.json({ message: password.message }, { status: 400 });
  }

  let stored;

  try {
    stored = await getStoredPasswordHash(id);
  } catch {
    return Response.json(
      { message: "댓글을 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  if (stored.setupRequired) {
    return setupResponse();
  }

  if (!stored.passwordHash) {
    return Response.json({ message: "댓글을 찾지 못했습니다." }, { status: 404 });
  }

  if (!verifyCommentManagementPassword(password.value, stored.passwordHash)) {
    return Response.json(
      { message: "비밀번호가 일치하지 않습니다." },
      { status: 403 },
    );
  }

  const supabase = getCommentsClient();

  if (!supabase) {
    return setupResponse();
  }

  const { error } = await supabase
    .from("comments")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return Response.json(
      { message: "댓글을 삭제하지 못했습니다." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
