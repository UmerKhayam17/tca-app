import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socketService from "@/services/socket/socket.service";
import { queryKeysForModuleSync, type ModuleSyncEvent } from "@/lib/realtimeSync";

/**
 * Connects panel sockets and invalidates React Query caches on module CRUD sync events.
 */
export function usePanelRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    void socketService.connectPanel();

    const onSync = (event: ModuleSyncEvent) => {
      const keys = queryKeysForModuleSync(event);
      keys.forEach((key) => {
        qc.invalidateQueries({ queryKey: key });
      });
    };

    const onStaff = () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staffRoles"] });
      qc.invalidateQueries({ queryKey: ["moduleRegistry"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["permissionCatalog"] });
    };

    socketService.onModuleSync(onSync);
    socketService.onStaffUpdate(onStaff);

    return () => {
      socketService.offModuleSync(onSync);
      socketService.offStaffUpdate(onStaff);
    };
  }, [enabled, qc]);
}
