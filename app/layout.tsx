import type { Metadata } from "next";
import { BlogViewProvider } from "@/components/blog-view-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
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
    title: site.title,
    description: site.description,
    type: "website",
    images: ["/astro-nano.png"],
  },
};

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
        <BlogViewProvider>
          <main className="flex-1 py-12">{children}</main>
        </BlogViewProvider>
        <Footer />
      </body>
    </html>
  );
}
