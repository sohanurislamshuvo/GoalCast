import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoalCast — World Cup 2026 Live TV",
  description:
    "Watch World Cup 2026 and live sports channels — schedule, live scores and free public streams in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-border py-6">
          <div className="mx-auto max-w-6xl space-y-1 px-4 text-xs text-muted">
            <p>
              GoalCast does not host or distribute any video content. Public
              channels are indexed by the open-source{" "}
              <a
                href="https://github.com/iptv-org/iptv"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                iptv-org
              </a>{" "}
              project from publicly available sources. Only add streams to your
              curated list that you are legally allowed to watch.
            </p>
            <p>
              Match data:{" "}
              <a
                href="https://www.football-data.org/"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                football-data.org
              </a>{" "}
              /{" "}
              <a
                href="https://github.com/openfootball/worldcup.json"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                openfootball
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
