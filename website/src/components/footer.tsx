import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="font-semibold">Google Calendar MCP</span>
          </div>
          <div className="flex space-x-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <a href="https://github.com/nspady/google-calendar-mcp" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="text-center text-sm text-muted-foreground">
          <p>Open source calendar integration for AI assistants. Built with ❤️ for the developer community.</p>
        </div>
      </div>
    </footer>
  );
}