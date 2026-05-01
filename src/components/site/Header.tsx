import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Mountain, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Header() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl tracking-wider">LateriteIQ</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          {email ? (
            <>
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
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-md px-3 py-1.5 text-sm hover:bg-accent/10 hover:text-accent"
              >
                Sign in
              </Link>
              <Link to="/auth">
                <Button size="sm">Start Inspection</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
