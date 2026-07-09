import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { moduleHref } from "@/lib/panelMenus";
import { Role } from "@/lib/auth";

const SettingsModule = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "admin") as Role;

  // Get module permissions for display
  const modulePerms = user?.modulePermissions ? Object.entries(user.modulePermissions) : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 max-w-2xl">
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

      {modulePerms.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="font-semibold text-primary">Module permissions</div>
          <div className="space-y-2">
            {modulePerms.map(([moduleName, actions]) => (
              <div key={moduleName} className="text-sm bg-muted/40 rounded p-3">
                <div className="font-medium text-primary capitalize">{moduleName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Array.isArray(actions) && actions.length > 0
                    ? actions.join(", ")
                    : "No actions"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-2">
        <div className="font-semibold text-primary">Access & permissions</div>
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

