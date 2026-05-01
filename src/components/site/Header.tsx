import { Link } from "@tanstack/react-router";
import { Mountain } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl tracking-wider">LateriteIQ</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/inspect"
            className="rounded-md px-3 py-1.5 text-sm hover:bg-accent/10 hover:text-accent"
            activeProps={{ className: "text-primary" }}
          >
            Inspect
          </Link>
          <Link
            to="/history"
            className="rounded-md px-3 py-1.5 text-sm hover:bg-accent/10 hover:text-accent"
            activeProps={{ className: "text-primary" }}
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
