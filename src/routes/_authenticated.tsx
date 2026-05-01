import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/_authenticated")({
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
