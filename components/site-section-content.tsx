import { sectionBodyToHtml } from "@/lib/site-sections";
import { cn } from "@/lib/utils";

type SiteSectionContentProps = {
  body: string;
  className?: string;
};

export function SiteSectionContent({
  body,
  className,
}: SiteSectionContentProps) {
  return (
    <article
      className={cn("article", className)}
      dangerouslySetInnerHTML={{ __html: sectionBodyToHtml(body) }}
    />
  );
}
