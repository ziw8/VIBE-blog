"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isSubmitting}
      className="text-sm text-black/40 underline decoration-black/15 underline-offset-2 transition-colors duration-300 ease-in-out hover:text-black hover:decoration-black/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white/40 dark:decoration-white/30 dark:hover:text-white dark:hover:decoration-white/50"
      onClick={handleClick}
    >
      {isSubmitting ? "잠시만요" : "관리자 나가기"}
    </button>
  );
}
