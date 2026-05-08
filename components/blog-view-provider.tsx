"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type BlogView = "posts" | "tags";

type BlogViewContextValue = {
  blogView: BlogView;
  targetTag: string | null;
  setBlogView: (view: BlogView) => void;
  setTargetTag: (tag: string | null) => void;
};

const BlogViewContext = createContext<BlogViewContextValue | null>(null);

export function BlogViewProvider({ children }: { children: ReactNode }) {
  const [blogView, setBlogView] = useState<BlogView>("posts");
  const [targetTag, setTargetTag] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      blogView,
      targetTag,
      setBlogView,
      setTargetTag,
    }),
    [blogView, targetTag],
  );

  return (
    <BlogViewContext.Provider value={value}>
      {children}
    </BlogViewContext.Provider>
  );
}

export function useBlogView() {
  const context = useContext(BlogViewContext);

  if (!context) {
    throw new Error("useBlogView must be used within BlogViewProvider.");
  }

  return context;
}
