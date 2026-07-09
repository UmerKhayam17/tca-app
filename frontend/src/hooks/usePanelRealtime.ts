import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socketService from "@/services/socket/socket.service";
import { queryKeysForModuleSync, type ModuleSyncEvent } from "@/lib/realtimeSync";

const SYNC_DEBOUNCE_MS = 400;

/**
 * Connects panel sockets and invalidates React Query caches on module CRUD sync events.
 */
export function usePanelRealtime(enabled: boolean) {
  const qc = useQueryClient();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    void socketService.connectPanel();

    const flushSync = () => {
      const keys = [...pendingKeysRef.current].map((k) => JSON.parse(k) as string[]);
      pendingKeysRef.current.clear();
      keys.forEach((key) => {
        qc.invalidateQueries({ queryKey: key });
      });
    };

    const onSync = (event: ModuleSyncEvent) => {
      queryKeysForModuleSync(event).forEach((key) => {
        pendingKeysRef.current.add(JSON.stringify(key));
      });
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(flushSync, SYNC_DEBOUNCE_MS);
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
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      pendingKeysRef.current.clear();
      socketService.offModuleSync(onSync);
      socketService.offStaffUpdate(onStaff);
    };
  }, [enabled, qc]);
}
