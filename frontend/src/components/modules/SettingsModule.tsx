import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { moduleHref } from "@/lib/panelMenus";
import { Role } from "@/lib/auth";

const SettingsModule = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "admin") as Role;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 max-w-lg">
      <Card className="p-4 space-y-3">
        <div className="font-semibold text-primary">Your account</div>
        {user ? (
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-muted-foreground text-xs">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Role</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Not signed in.</p>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <div className="font-semibold text-primary">Access & permissions</div>
        <p className="text-xs text-muted-foreground">
          Module access is controlled by your account permissions on the server. Admins can assign
          per-user access on the Permissions page.
        </p>
        {(role === "admin" || user?.modulePermissions) && (
          <Button variant="outline" size="sm" asChild>
            <Link to={moduleHref(role, "permissions")}>Open Permissions</Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild className="block">
          <Link to={moduleHref(role, "permission-catalog")}>View permission catalog</Link>
        </Button>
      </Card>
    </div>
  );
};

export default SettingsModule;
