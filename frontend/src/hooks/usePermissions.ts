import { useEffect, useState } from "react";
import {
  loadPermissions, PermLevel, ModuleKey, PERM_CHANGE_EVENT,
} from "@/lib/permissions";
import { Role } from "@/lib/auth";

export const usePermissions = () => {
  const [perms, setPerms] = useState(() => loadPermissions());

  useEffect(() => {
    const sync = () => setPerms(loadPermissions());
    window.addEventListener(PERM_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PERM_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const get = (role: Role, mod: ModuleKey): PermLevel =>
    perms[role]?.[mod] ?? "none";

  return { perms, get };
};
