import type { Metadata } from "next";
import { AdminEasterEgg } from "@/components/admin-easter-egg";
import { BlogViewProvider } from "@/components/blog-view-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getSite, site } from "@/lib/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const currentSite = await getSite();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: currentSite.title,
      template: `%s | ${currentSite.name}`,
    },
    description: currentSite.description,
    icons: [
      {
        rel: "icon",
        url: "/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        url: "/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    openGraph: {
      title: currentSite.title,
      description: currentSite.description,
      type: "website",
      images: ["/astro-nano.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const theme = localStorage.getItem("theme") || "system";
                  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  document.documentElement.classList.toggle("dark", dark);
                  document.documentElement.dataset.theme = theme;
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <Header />
        <AdminEasterEgg />
        <BlogViewProvider>
          <main className="flex-1 py-12">{children}</main>
        </BlogViewProvider>
        <Footer />
      </body>
    </html>
  );
}
