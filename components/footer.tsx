import { Container } from "@/components/container";
import { ThemeControls } from "@/components/theme-controls";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="py-5 text-sm">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <div>&copy; 2026 | {site.name}</div>
          <ThemeControls />
        </div>
      </Container>
    </footer>
  );
}
