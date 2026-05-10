export const COMMENT_EMOJIS = ["👍", "❤️", "🔥", "😆", "😲", "😭"] as const;

export type CommentEmoji = (typeof COMMENT_EMOJIS)[number];

export type PublicComment = {
  id: string;
  postSlug: string;
  parentId: string | null;
  nickname: string;
  body: string;
  emoji: CommentEmoji | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
};

export const COMMENT_LIMITS = {
  postSlugMax: 160,
  nicknameMax: 24,
  bodyMax: 1000,
  passwordMin: 4,
  passwordMax: 72,
} as const;

export function isCommentEmoji(value: unknown): value is CommentEmoji {
  return (
    typeof value === "string" &&
    COMMENT_EMOJIS.includes(value as CommentEmoji)
  );
}
