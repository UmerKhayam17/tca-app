import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { ensureAccessToken } from "@/lib/auth";
import { getSocketUrl } from "@/lib/api";

/**
 * Listens for `staff:update` from the API and refreshes staff / registry queries without a full page reload.
 */
export function useStaffRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let socket: Socket | null = null;
    let cancelled = false;

    void (async () => {
      const token = await ensureAccessToken();
      if (!token || cancelled) return;

      socket = io(getSocketUrl(), {
        auth: (cb) => {
          void ensureAccessToken().then((t) => cb({ token: t || "" }));
        },
        transports: ["websocket", "polling"],
      });

      const onStaff = () => {
        qc.invalidateQueries({ queryKey: ["staff"] });
        qc.invalidateQueries({ queryKey: ["staffRoles"] });
        qc.invalidateQueries({ queryKey: ["moduleRegistry"] });
        qc.invalidateQueries({ queryKey: ["allUsers"] });
        qc.invalidateQueries({ queryKey: ["permissionCatalog"] });
      };

      socket.on("staff:update", onStaff);
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [enabled, qc]);
}
