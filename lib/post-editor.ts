export type PostEditorPayload = {
  contentHtml: string;
  tags: string[];
  title: string;
};

export type PostDraftPayload = PostEditorPayload;

export function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePostHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function makePostDescription(contentHtml: string) {
  const text = stripHtml(contentHtml);

  if (text.length <= 120) {
    return text;
  }

  return `${text.slice(0, 120).trim()}...`;
}

export function getReadingTime(contentHtml: string) {
  const textLength = stripHtml(contentHtml).length;
  const minutes = Math.max(1, Math.ceil(textLength / 500));

  return `${minutes}분 읽기`;
}

export function slugifyTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `post-${Date.now()}`;
}

export function validatePostEditorPayload(
  payload: unknown,
  registeredTags: string[],
): { ok: true; value: PostEditorPayload } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "글 정보를 다시 확인해주세요." };
  }

  const record = payload as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const contentHtml =
    typeof record.contentHtml === "string"
      ? sanitizePostHtml(record.contentHtml).trim()
      : "";
  const plainText = stripHtml(contentHtml);
  const tags = Array.isArray(record.tags)
    ? record.tags.filter(
        (tag): tag is string =>
          typeof tag === "string" && registeredTags.includes(tag),
      )
    : [];

  if (!title || title.length > 120) {
    return { ok: false, message: "제목은 120자 이하로 입력해주세요." };
  }

  if (tags.length === 0) {
    return { ok: false, message: "태그를 하나 이상 선택해주세요." };
  }

  if (!plainText || contentHtml.length > 60000) {
    return { ok: false, message: "본문을 입력해주세요." };
  }

  return {
    ok: true,
    value: {
      contentHtml,
      tags,
      title,
    },
  };
}

export function validatePostDraftPayload(
  payload: unknown,
  registeredTags: string[],
): { ok: true; value: PostDraftPayload } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "임시저장 정보를 다시 확인해주세요." };
  }

  const record = payload as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const contentHtml =
    typeof record.contentHtml === "string"
      ? sanitizePostHtml(record.contentHtml).trim()
      : "";
  const tags = Array.isArray(record.tags)
    ? record.tags.filter(
        (tag): tag is string =>
          typeof tag === "string" && registeredTags.includes(tag),
      )
    : [];

  if (title.length > 120) {
    return { ok: false, message: "제목은 120자 이하로 입력해주세요." };
  }

  if (contentHtml.length > 60000) {
    return { ok: false, message: "본문이 너무 깁니다." };
  }

  return {
    ok: true,
    value: {
      contentHtml,
      tags,
      title,
    },
  };
}
