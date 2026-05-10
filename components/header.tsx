import { SiteLink } from "@/components/site-link";
import { site } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 pt-[calc(1rem+env(safe-area-inset-top))] pb-6">
      <div className="mx-auto w-full max-w-screen-lg px-5">
        <div className="flex flex-wrap justify-between gap-y-2">
          <SiteLink href="/" underline={false}>
            <span className="text-black underline decoration-black underline-offset-2 dark:text-white dark:decoration-white">
              {site.name}
            </span>
          </SiteLink>
          <nav aria-label="Primary navigation" className="flex gap-4">
            <SiteLink href="/blog" underline={false}>
              Posts
            </SiteLink>
            <SiteLink href="/about" underline={false}>
              About
            </SiteLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
