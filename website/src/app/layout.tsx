import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Google Calendar MCP - AI Calendar Integration",
  description: "A powerful Model Context Protocol server for seamless Google Calendar integration with AI assistants. Create, manage, and search calendar events with natural language.",
  keywords: ["Google Calendar", "MCP", "AI", "Calendar Integration", "Model Context Protocol", "Claude", "Assistant"],
  authors: [{ name: "Google Calendar MCP" }],
  creator: "Google Calendar MCP",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Google Calendar MCP - AI Calendar Integration",
    description: "A powerful Model Context Protocol server for seamless Google Calendar integration with AI assistants.",
    siteName: "Google Calendar MCP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Calendar MCP - AI Calendar Integration",
    description: "A powerful Model Context Protocol server for seamless Google Calendar integration with AI assistants.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
