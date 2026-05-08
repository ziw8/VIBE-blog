import NextLink from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  external?: boolean;
  underline?: boolean;
};

export function SiteLink({
  href,
  children,
  external,
  underline = true,
  className,
  ...props
}: SiteLinkProps) {
  const isExternal = external ?? /^https?:\/\//.test(href);
  const linkClassName = cn(
    "inline-block text-current transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white",
    "decoration-black/15 hover:decoration-black/25 dark:decoration-white/30 dark:hover:decoration-white/50",
    underline && "underline underline-offset-2",
    className,
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClassName}
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={linkClassName} {...props}>
      {children}
    </NextLink>
  );
}
