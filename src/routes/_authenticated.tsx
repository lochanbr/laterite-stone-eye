import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
