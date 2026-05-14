import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth";

const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim() || "http://127.0.0.1:5000";

/**
 * Listens for `staff:update` from the API and refreshes staff / registry queries without a full page reload.
 */
export function useStaffRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const token = getAccessToken();
    if (!token) return;

    const socket: Socket = io(socketUrl, {
      auth: { token },
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
    return () => {
      socket.off("staff:update", onStaff);
      socket.disconnect();
    };
  }, [enabled, qc]);
}
