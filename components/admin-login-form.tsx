"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "관리자 인증에 실패했습니다.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "관리자 인증에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="grid gap-1.5 text-sm">
        <span className="text-black/45 dark:text-white/45">관리자 암호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 rounded-md border border-black/10 bg-transparent px-3 text-black outline-none transition-colors duration-300 ease-in-out placeholder:text-black/25 focus:border-black/30 dark:border-white/15 dark:text-white dark:placeholder:text-white/25 dark:focus:border-white/35"
          autoComplete="current-password"
          required
        />
      </label>

      {message ? (
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-9 rounded-md border border-black/20 px-4 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/35 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/25 dark:text-white dark:hover:border-white/40 dark:hover:bg-white dark:hover:text-black"
      >
        {isSubmitting ? "확인 중" : "진입"}
      </button>
    </form>
  );
}
