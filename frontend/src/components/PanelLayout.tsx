import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import PanelSidebar from "./PanelSidebar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { usePanelRealtime } from "@/hooks/usePanelRealtime";

const PanelLayout = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.body.classList.add("cms-active");
    return () => document.body.classList.remove("cms-active");
  }, []);

  usePanelRealtime(Boolean(user));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 text-muted-foreground text-sm">
        Loading portal…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="cms-root min-h-screen flex w-full bg-secondary/30">
        <PanelSidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur px-3 sm:px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <div className="text-sm font-semibold text-primary truncate capitalize">{user.role} Portal</div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={() => void logout()} className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PanelLayout;
