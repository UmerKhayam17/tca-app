import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  activateSession,
  fetchSessions,
  isSessionWritable,
  sessionStatus,
  type AcademicSession,
  type SessionStatus,
} from "@/lib/configApi";

const STATUS_SUFFIX: Record<SessionStatus, string> = {
  active: " (active)",
  completed: " (completed)",
  archived: " (archived)",
};

export function useActiveSessionId(
  sessionId: string,
  setSessionId: (id: string) => void
): string {
  const { data: sessions = [] } = useQuery({
    queryKey: ["academic-sessions"],
    queryFn: () => fetchSessions(),
  });

  useEffect(() => {
    if (!sessions.length) return;

    const current = sessions.find((s) => s._id === sessionId);
    if (!sessionId || !current || !isSessionWritable(current)) {
      const pick =
        sessions.find((s) => s.isActive && isSessionWritable(s)) ||
        sessions.find((s) => isSessionWritable(s)) ||
        sessions[0];
      if (pick && pick._id !== sessionId) setSessionId(pick._id);
    }
  }, [sessionId, sessions, setSessionId]);

  return sessionId;
}

export default function SessionBar({
  sessionId,
  onSessionChange,
  extra,
}: {
  sessionId: string;
  onSessionChange: (id: string) => void;
  extra?: React.ReactNode;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["academic-sessions"],
    queryFn: () => fetchSessions(),
  });

  const selected = sessions.find((s) => s._id === sessionId);
  const selectedWritable = selected ? isSessionWritable(selected) : false;
  const selectedStatus = selected ? sessionStatus(selected) : null;

  const activateMut = useMutation({
    mutationFn: () => activateSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-sessions"] });
      toast({ title: "Session is now active", description: "You can add classes and timetable data." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-3 border-b bg-muted/30 flex flex-wrap items-end gap-4">
      <div className="min-w-[200px]">
        <Label className="text-xs text-muted-foreground">Academic session</Label>
        <select
          className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={sessionId}
          onChange={(e) => onSessionChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">{isLoading ? "Loading…" : "Select session"}</option>
          {sessions.map((s: AcademicSession) => {
            const st = sessionStatus(s);
            return (
              <option key={s._id} value={s._id}>
                {s.name}
                {STATUS_SUFFIX[st]}
              </option>
            );
          })}
        </select>
      </div>

      {sessionId && selected && !selectedWritable && selectedStatus !== "archived" && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={activateMut.isPending}
          onClick={() => activateMut.mutate()}
        >
          Set as active session
        </Button>
      )}

      {sessionId && selected && !selectedWritable && selectedStatus === "archived" && (
        <p className="text-xs text-muted-foreground max-w-xs">
          This session is archived (read-only). Clone structure in Session history to start a new year.
        </p>
      )}

      {extra}
    </div>
  );
}
