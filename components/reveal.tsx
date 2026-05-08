import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealStyle = CSSProperties & {
  "--delay"?: string;
};

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("reveal", className)}
      style={{ "--delay": `${delay}ms` } as RevealStyle}
    >
      {children}
    </div>
  );
}
