import {
  COMMENT_LIMITS,
  isCommentEmoji,
  type CommentEmoji,
} from "@/lib/comment-config";

type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      message: string;
    };

export type CreateCommentInput = {
  postSlug: string;
  parentId: string | null;
  nickname: string;
  body: string;
  password: string;
  emoji: CommentEmoji | null;
};

export type UpdateCommentInput = {
  body: string;
  password: string;
  emoji: CommentEmoji | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeParentId(value: unknown): ValidationResult<string | null> {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: null };
  }

  if (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return { ok: true, value };
  }

  return { ok: false, message: "답글을 달 댓글 정보를 다시 확인해주세요." };
}

function normalizeEmoji(value: unknown): ValidationResult<CommentEmoji | null> {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: null };
  }

  if (!isCommentEmoji(value)) {
    return { ok: false, message: "선택할 수 없는 이모지입니다." };
  }

  return { ok: true, value };
}

export function validatePassword(password: unknown): ValidationResult<string> {
  const normalized = normalizeString(password);

  if (
    normalized.length < COMMENT_LIMITS.passwordMin ||
    normalized.length > COMMENT_LIMITS.passwordMax
  ) {
    return {
      ok: false,
      message: `비밀번호는 ${COMMENT_LIMITS.passwordMin}자 이상 ${COMMENT_LIMITS.passwordMax}자 이하로 입력해주세요.`,
    };
  }

  return { ok: true, value: normalized };
}

export function validateCreateComment(
  payload: unknown,
): ValidationResult<CreateCommentInput> {
  const record = asRecord(payload);

  if (!record) {
    return { ok: false, message: "댓글 정보를 다시 확인해주세요." };
  }

  const postSlug = normalizeString(record.postSlug);
  const parentId = normalizeParentId(record.parentId);
  const nickname = normalizeString(record.nickname);
  const body = normalizeString(record.body);
  const password = validatePassword(record.password);
  const emoji = normalizeEmoji(record.emoji);

  if (!postSlug || postSlug.length > COMMENT_LIMITS.postSlugMax) {
    return { ok: false, message: "게시글 정보를 다시 확인해주세요." };
  }

  if (!parentId.ok) {
    return parentId;
  }

  if (!nickname || nickname.length > COMMENT_LIMITS.nicknameMax) {
    return {
      ok: false,
      message: `닉네임은 ${COMMENT_LIMITS.nicknameMax}자 이하로 입력해주세요.`,
    };
  }

  if (!body || body.length > COMMENT_LIMITS.bodyMax) {
    return {
      ok: false,
      message: `댓글은 ${COMMENT_LIMITS.bodyMax}자 이하로 입력해주세요.`,
    };
  }

  if (!password.ok) {
    return password;
  }

  if (!emoji.ok) {
    return emoji;
  }

  return {
    ok: true,
    value: {
      postSlug,
      parentId: parentId.value,
      nickname,
      body,
      password: password.value,
      emoji: emoji.value,
    },
  };
}

export function validateUpdateComment(
  payload: unknown,
): ValidationResult<UpdateCommentInput> {
  const record = asRecord(payload);

  if (!record) {
    return { ok: false, message: "댓글 정보를 다시 확인해주세요." };
  }

  const body = normalizeString(record.body);
  const password = validatePassword(record.password);
  const emoji = normalizeEmoji(record.emoji);

  if (!body || body.length > COMMENT_LIMITS.bodyMax) {
    return {
      ok: false,
      message: `댓글은 ${COMMENT_LIMITS.bodyMax}자 이하로 입력해주세요.`,
    };
  }

  if (!password.ok) {
    return password;
  }

  if (!emoji.ok) {
    return emoji;
  }

  return {
    ok: true,
    value: {
      body,
      password: password.value,
      emoji: emoji.value,
    },
  };
}
