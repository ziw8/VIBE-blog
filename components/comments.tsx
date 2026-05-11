"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  COMMENT_EMOJIS,
  COMMENT_LIMITS,
  type CommentEmoji,
  type PublicComment,
} from "@/lib/comment-config";
import { cn } from "@/lib/utils";

type CommentsResponse = {
  comments?: PublicComment[];
  comment?: PublicComment;
  message?: string;
  setupRequired?: boolean;
  migrationRequired?: boolean;
  ok?: boolean;
};

type CommentEmojiSummaryProps = {
  comments: PublicComment[];
  className?: string;
};

type CommentForm = {
  nickname: string;
  password: string;
  body: string;
  emoji: CommentEmoji | "";
};

type PasswordErrorTarget = {
  action: "edit" | "delete";
  id: string;
  message: string;
} | null;

type ComposerProps = {
  form: CommentForm;
  setForm: Dispatch<SetStateAction<CommentForm>>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};

const initialForm: CommentForm = {
  nickname: "",
  password: "",
  body: "",
  emoji: "👍",
};

const PASSWORD_MISMATCH_MESSAGE = "비밀번호가 일치하지 않습니다.";

function getVisibleComments(comments: PublicComment[]) {
  const repliesByParentId = comments.reduce<Record<string, PublicComment[]>>(
    (groups, comment) => {
      if (!comment.parentId) {
        return groups;
      }

      groups[comment.parentId] = [...(groups[comment.parentId] ?? []), comment];
      return groups;
    },
    {},
  );
  const topLevelComments = comments.filter((comment) => !comment.parentId);

  return topLevelComments.flatMap((comment) => [
    comment,
    ...(repliesByParentId[comment.id] ?? []),
  ]);
}

function useCommentEmojiStats(comments: PublicComment[]) {
  return useMemo(() => {
    const counts = new Map<CommentEmoji, number>();

    getVisibleComments(comments).forEach((comment) => {
      if (comment.emoji) {
        counts.set(comment.emoji, (counts.get(comment.emoji) ?? 0) + 1);
      }
    });

    return COMMENT_EMOJIS.map((emoji) => ({
      emoji,
      count: counts.get(emoji) ?? 0,
    })).filter(({ count }) => count > 0);
  }, [comments]);
}

export function CommentEmojiSummary({
  comments,
  className,
}: CommentEmojiSummaryProps) {
  const emojiStats = useCommentEmojiStats(comments);

  if (emojiStats.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="댓글 이모지 요약"
      className={cn("flex flex-wrap justify-center gap-2", className)}
    >
      {emojiStats.map(({ emoji, count }) => (
        <span
          key={emoji}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.02] px-3 text-sm text-black/70 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/75"
        >
          <span aria-hidden="true">{emoji}</span>
          <span className="text-xs font-semibold text-black/50 dark:text-white/50">
            {count}
          </span>
        </span>
      ))}
    </div>
  );
}

export function CommentEmojiSummaryLoader({ postSlug }: { postSlug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((result: CommentsResponse | null) => {
          setComments(result?.comments ?? []);
        })
        .catch(() => {});
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [postSlug]);

  return <CommentEmojiSummary comments={comments} />;
}

function formatCommentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function parseResponse(response: Response) {
  const result = (await response.json().catch(() => ({}))) as CommentsResponse;

  if (!response.ok) {
    throw new Error(result.message ?? "요청을 처리하지 못했습니다.");
  }

  return result;
}

function CommentComposer({
  form,
  setForm,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: ComposerProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-black/45 dark:text-white/45">닉네임</span>
          <input
            value={form.nickname}
            maxLength={COMMENT_LIMITS.nicknameMax}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                nickname: event.target.value,
              }))
            }
            className="h-10 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            placeholder="닉네임"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-black/45 dark:text-white/45">비밀번호</span>
          <input
            type="password"
            value={form.password}
            minLength={COMMENT_LIMITS.passwordMin}
            maxLength={COMMENT_LIMITS.passwordMax}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            className="h-10 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
            placeholder="수정/삭제용"
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {COMMENT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`${emoji} 이모지 선택`}
            className={cn(
              "grid size-8 place-items-center rounded-md border text-sm transition-colors duration-300 ease-in-out",
              form.emoji === emoji
                ? "border-black/35 bg-black text-white dark:border-white/50 dark:bg-white dark:text-black"
                : "border-black/10 text-black/65 hover:border-black/25 hover:text-black dark:border-white/15 dark:text-white/70 dark:hover:border-white/35 dark:hover:text-white",
            )}
            onClick={() =>
              setForm((current) => ({
                ...current,
                emoji: current.emoji === emoji ? "" : emoji,
              }))
            }
          >
            {emoji}
          </button>
        ))}
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="text-black/45 dark:text-white/45">댓글</span>
        <textarea
          value={form.body}
          maxLength={COMMENT_LIMITS.bodyMax}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              body: event.target.value,
            }))
          }
          className="min-h-28 resize-y rounded-md border border-black/10 bg-transparent px-3 py-2 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
          placeholder="댓글을 남겨주세요."
          required
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-black/35 dark:text-white/35">
          {form.body.length}/{COMMENT_LIMITS.bodyMax}
        </p>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <button
              type="button"
              className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
              onClick={onCancel}
            >
              취소
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 rounded-md border border-black/20 px-4 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export function Comments({ postSlug }: { postSlug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [form, setForm] = useState<CommentForm>(initialForm);
  const [replyForm, setReplyForm] = useState<CommentForm>(initialForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editEmoji, setEditEmoji] = useState<CommentEmoji | "">("");
  const [editPassword, setEditPassword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [passwordError, setPasswordError] =
    useState<PasswordErrorTarget>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const encodedPostSlug = useMemo(() => encodeURIComponent(postSlug), [postSlug]);

  const repliesByParentId = useMemo(() => {
    return comments.reduce<Record<string, PublicComment[]>>((groups, comment) => {
      if (!comment.parentId) {
        return groups;
      }

      groups[comment.parentId] = [...(groups[comment.parentId] ?? []), comment];
      return groups;
    }, {});
  }, [comments]);

  const topLevelComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments],
  );

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postSlug=${encodedPostSlug}`);
      const result = (await response.json().catch(() => ({}))) as CommentsResponse;

      if (result.setupRequired) {
        setSetupRequired(true);
        setComments([]);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message ?? "댓글을 불러오지 못했습니다.");
      }

      setSetupRequired(false);
      setMigrationRequired(Boolean(result.migrationRequired));
      setComments(result.comments ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [encodedPostSlug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadComments]);

  async function submitComment(parentId: string | null, values: CommentForm) {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        postSlug,
        parentId,
        emoji: values.emoji || null,
      }),
    });

    return parseResponse(response);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setPasswordError(null);

    try {
      const result = await submitComment(null, form);

      if (result.comment) {
        setComments((current) => [...current, result.comment as PublicComment]);
      }

      setForm(initialForm);
      setIsCreateOpen(false);
      setMigrationRequired(Boolean(result.migrationRequired));
      setMessage("댓글이 등록되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "댓글을 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!replyingToId) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await submitComment(replyingToId, replyForm);

      if (result.comment) {
        setComments((current) => [...current, result.comment as PublicComment]);
      }

      setReplyForm(initialForm);
      setReplyingToId(null);
      setMigrationRequired(Boolean(result.migrationRequired));
      setMessage("답글이 등록되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "답글을 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/comments/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: editBody,
          emoji: editEmoji || null,
          password: editPassword,
        }),
      });
      const result = await parseResponse(response);

      if (result.comment) {
        setComments((current) =>
          current.map((comment) =>
            comment.id === result.comment?.id
              ? (result.comment as PublicComment)
              : comment,
          ),
        );
      }

      setEditingId(null);
      setEditBody("");
      setEditEmoji("");
      setEditPassword("");
      setPasswordError(null);
      setMigrationRequired(Boolean(result.migrationRequired));
      setMessage("댓글이 수정되었습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "댓글을 수정하지 못했습니다.";

      if (errorMessage === PASSWORD_MISMATCH_MESSAGE) {
        setPasswordError({
          action: "edit",
          id: editingId,
          message: errorMessage,
        });
      } else {
        setMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deleteId) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setPasswordError(null);

    try {
      const response = await fetch(`/api/comments/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      await parseResponse(response);
      setComments((current) =>
        current.filter(
          (comment) => comment.id !== deleteId && comment.parentId !== deleteId,
        ),
      );
      setDeleteId(null);
      setDeletePassword("");
      setPasswordError(null);
      setMessage("댓글이 삭제되었습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "댓글을 삭제하지 못했습니다.";

      if (errorMessage === PASSWORD_MISMATCH_MESSAGE) {
        setPasswordError({
          action: "delete",
          id: deleteId,
          message: errorMessage,
        });
      } else {
        setMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditor(comment: PublicComment) {
    setEditingId(comment.id);
    setEditBody(comment.body);
    setEditEmoji(comment.emoji ?? "");
    setEditPassword("");
    setDeleteId(null);
    setDeletePassword("");
    setReplyingToId(null);
    setPasswordError(null);
    setMessage(null);
  }

  function openDelete(commentId: string) {
    setDeleteId(commentId);
    setDeletePassword("");
    setEditingId(null);
    setEditBody("");
    setEditEmoji("");
    setEditPassword("");
    setReplyingToId(null);
    setPasswordError(null);
    setMessage(null);
  }

  function openReply(commentId: string) {
    setReplyingToId((current) => (current === commentId ? null : commentId));
    setReplyForm(initialForm);
    setEditingId(null);
    setDeleteId(null);
    setPasswordError(null);
    setMessage(null);
  }

  function getPasswordError(action: "edit" | "delete", id: string) {
    return passwordError?.action === action && passwordError.id === id
      ? passwordError.message
      : null;
  }

  function clearPasswordError(action: "edit" | "delete", id: string) {
    setPasswordError((current) =>
      current?.action === action && current.id === id ? null : current,
    );
  }

  if (setupRequired) {
    return (
      <div className="space-y-2 text-sm text-black/50 dark:text-white/50">
        <p>Supabase 댓글 설정이 필요합니다.</p>
        <p>
          <code>SUPABASE_URL</code>, <code>SUPABASE_SECRET_KEY</code>를
          설정하고 <code>supabase/comments.sql</code>을 실행해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-semibold text-black dark:text-white">Comments</h2>
        <button
          type="button"
          className="shrink-0 text-right text-sm font-semibold text-black underline decoration-black/25 underline-offset-4 transition-colors duration-300 ease-in-out hover:decoration-black/60 dark:text-white dark:decoration-white/35 dark:hover:decoration-white/70"
          onClick={() => setIsCreateOpen((current) => !current)}
        >
          {isCreateOpen ? "닫기" : "이모지와 댓글 남기기"}
        </button>
      </div>

      {isCreateOpen ? (
        <div className="border-t border-black/10 pt-5 dark:border-white/15">
          <CommentComposer
            form={form}
            setForm={setForm}
            submitLabel="등록"
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </div>
      ) : null}

      {migrationRequired ? (
        <p className="text-sm text-black/45 dark:text-white/45">
          답글과 새 이모지를 쓰려면 Supabase SQL을 다시 실행해주세요.
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-black/45 dark:text-white/45">{message}</p>
      ) : null}

      <div className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-black/45 dark:text-white/45">
            댓글을 불러오는 중입니다.
          </p>
        ) : null}

        {!isLoading && topLevelComments.length === 0 ? (
          <p className="text-sm text-black/45 dark:text-white/45">
            첫 댓글을 남겨주세요!
          </p>
        ) : null}

        {topLevelComments.map((comment) => (
          <article
            key={comment.id}
            className="border-t border-black/10 pt-5 dark:border-white/15"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-black dark:text-white">
                  {comment.emoji ? (
                    <span className="mr-2" aria-hidden="true">
                      {comment.emoji}
                    </span>
                  ) : null}
                  {comment.nickname}
                </p>
                <p className="mt-1 text-xs text-black/35 dark:text-white/35">
                  {formatCommentDate(comment.createdAt)}
                  {comment.isEdited ? " · 수정됨" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-black/40 dark:text-white/40">
                <button
                  type="button"
                  className="transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white"
                  onClick={() => openReply(comment.id)}
                >
                  답글 남기기
                </button>
                <button
                  type="button"
                  className="transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white"
                  onClick={() => openEditor(comment)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white"
                  onClick={() => openDelete(comment.id)}
                >
                  삭제
                </button>
              </div>
            </div>

            {editingId === comment.id ? (
              <form onSubmit={handleUpdate} className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {COMMENT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`${emoji} 이모지 선택`}
                      className={cn(
                        "grid size-8 place-items-center rounded-md border text-sm transition-colors duration-300 ease-in-out",
                        editEmoji === emoji
                          ? "border-black/35 bg-black text-white dark:border-white/50 dark:bg-white dark:text-black"
                          : "border-black/10 text-black/65 hover:border-black/25 hover:text-black dark:border-white/15 dark:text-white/70 dark:hover:border-white/35 dark:hover:text-white",
                      )}
                      onClick={() =>
                        setEditEmoji((current) =>
                          current === emoji ? "" : emoji,
                        )
                      }
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <textarea
                  value={editBody}
                  maxLength={COMMENT_LIMITS.bodyMax}
                  onChange={(event) => setEditBody(event.target.value)}
                  className="min-h-24 w-full resize-y rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35"
                  required
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="grid gap-1 sm:min-w-52">
                    <input
                      type="password"
                      value={editPassword}
                      minLength={COMMENT_LIMITS.passwordMin}
                      maxLength={COMMENT_LIMITS.passwordMax}
                      onChange={(event) => {
                        setEditPassword(event.target.value);
                        clearPasswordError("edit", comment.id);
                      }}
                      className="h-9 rounded-md border border-black/10 bg-transparent px-3 text-sm text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
                      placeholder="비밀번호"
                      required
                    />
                    {getPasswordError("edit", comment.id) ? (
                      <p className="pl-3 pt-1 text-xs text-red-600 dark:text-red-400">
                        {getPasswordError("edit", comment.id)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-9 rounded-md border border-black/20 px-3 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-black/65 dark:text-white/70">
                {comment.body}
              </p>
            )}

            {deleteId === comment.id ? (
              <form
                onSubmit={handleDelete}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="grid gap-1 sm:min-w-52">
                  <input
                    type="password"
                    value={deletePassword}
                    minLength={COMMENT_LIMITS.passwordMin}
                    maxLength={COMMENT_LIMITS.passwordMax}
                    onChange={(event) => {
                      setDeletePassword(event.target.value);
                      clearPasswordError("delete", comment.id);
                    }}
                    className="h-9 rounded-md border border-black/10 bg-transparent px-3 text-sm text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
                    placeholder="비밀번호"
                    required
                  />
                  {getPasswordError("delete", comment.id) ? (
                    <p className="pl-3 pt-1 text-xs text-red-600 dark:text-red-400">
                      {getPasswordError("delete", comment.id)}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 rounded-md border border-black/20 px-3 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
                    onClick={() => setDeleteId(null)}
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : null}

            {replyingToId === comment.id ? (
              <div className="mt-5 ml-4 border-l border-black/10 pl-5 dark:border-white/15 sm:ml-6 sm:pl-6">
                <CommentComposer
                  form={replyForm}
                  setForm={setReplyForm}
                  submitLabel="답글 등록"
                  isSubmitting={isSubmitting}
                  onSubmit={handleReply}
                  onCancel={() => setReplyingToId(null)}
                />
              </div>
            ) : null}

            {repliesByParentId[comment.id]?.length ? (
              <div className="mt-5 ml-4 space-y-5 border-l border-black/10 pl-5 dark:border-white/15 sm:ml-6 sm:pl-6">
                {repliesByParentId[comment.id].map((reply) => (
                  <div key={reply.id} className="pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-black dark:text-white">
                          {reply.emoji ? (
                            <span className="mr-2" aria-hidden="true">
                              {reply.emoji}
                            </span>
                          ) : null}
                          {reply.nickname}
                        </p>
                        <p className="mt-1 text-xs text-black/35 dark:text-white/35">
                          {formatCommentDate(reply.createdAt)}
                          {reply.isEdited ? " · 수정됨" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-black/40 dark:text-white/40">
                        <button
                          type="button"
                          className="transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white"
                          onClick={() => openEditor(reply)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white"
                          onClick={() => openDelete(reply.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {editingId === reply.id ? (
                      <form onSubmit={handleUpdate} className="mt-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {COMMENT_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              aria-label={`${emoji} 이모지 선택`}
                              className={cn(
                                "grid size-8 place-items-center rounded-md border text-sm transition-colors duration-300 ease-in-out",
                                editEmoji === emoji
                                  ? "border-black/35 bg-black text-white dark:border-white/50 dark:bg-white dark:text-black"
                                  : "border-black/10 text-black/65 hover:border-black/25 hover:text-black dark:border-white/15 dark:text-white/70 dark:hover:border-white/35 dark:hover:text-white",
                              )}
                              onClick={() =>
                                setEditEmoji((current) =>
                                  current === emoji ? "" : emoji,
                                )
                              }
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={editBody}
                          maxLength={COMMENT_LIMITS.bodyMax}
                          onChange={(event) => setEditBody(event.target.value)}
                          className="min-h-24 w-full resize-y rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35"
                          required
                        />
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="grid gap-1 sm:min-w-52">
                            <input
                              type="password"
                              value={editPassword}
                              minLength={COMMENT_LIMITS.passwordMin}
                              maxLength={COMMENT_LIMITS.passwordMax}
                              onChange={(event) => {
                                setEditPassword(event.target.value);
                                clearPasswordError("edit", reply.id);
                              }}
                              className="h-9 rounded-md border border-black/10 bg-transparent px-3 text-sm text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
                              placeholder="비밀번호"
                              required
                            />
                            {getPasswordError("edit", reply.id) ? (
                              <p className="pl-3 pt-1 text-xs text-red-600 dark:text-red-400">
                                {getPasswordError("edit", reply.id)}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="h-9 rounded-md border border-black/20 px-3 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
                              onClick={() => setEditingId(null)}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-black/65 dark:text-white/70">
                        {reply.body}
                      </p>
                    )}

                    {deleteId === reply.id ? (
                      <form
                        onSubmit={handleDelete}
                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                      >
                        <div className="grid gap-1 sm:min-w-52">
                          <input
                            type="password"
                            value={deletePassword}
                            minLength={COMMENT_LIMITS.passwordMin}
                            maxLength={COMMENT_LIMITS.passwordMax}
                            onChange={(event) => {
                              setDeletePassword(event.target.value);
                              clearPasswordError("delete", reply.id);
                            }}
                            className="h-9 rounded-md border border-black/10 bg-transparent px-3 text-sm text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
                            placeholder="비밀번호"
                            required
                          />
                          {getPasswordError("delete", reply.id) ? (
                            <p className="pl-3 pt-1 text-xs text-red-600 dark:text-red-400">
                              {getPasswordError("delete", reply.id)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-9 rounded-md border border-black/20 px-3 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
                          >
                            삭제
                          </button>
                          <button
                            type="button"
                            className="h-9 rounded-md px-3 text-sm text-black/45 transition-colors duration-300 ease-in-out hover:text-black dark:text-white/45 dark:hover:text-white"
                            onClick={() => setDeleteId(null)}
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
