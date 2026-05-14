import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Store, useStore, newId } from "@/lib/store";
import { SessionUser } from "@/lib/auth";
import {
  ModuleActionCaps,
  PermLevel,
  canRead,
  sessionHasExplicitModulePayload,
} from "@/lib/permissions";

const ROOMS = [
  { id: "general", label: "General", roles: ["admin", "accountant", "teacher", "parent", "student"] },
  { id: "staff",   label: "Staff Only", roles: ["admin", "accountant", "teacher"] },
  { id: "parents", label: "Parents ↔ Teachers", roles: ["admin", "teacher", "parent", "student"] },
];

const ChatModule = ({ user, perm, caps }: { user: SessionUser; perm: PermLevel; caps: ModuleActionCaps }) => {
  const messages = useStore(() => Store.listChat());
  const visibleRooms = ROOMS.filter((r) => r.roles.includes(user.role));
  const [room, setRoom] = useState(visibleRooms[0]?.id ?? "general");
  const [text, setText] = useState("");
  const explicit = sessionHasExplicitModulePayload(user.modulePermissions);
  const canSend = caps.canParticipate || (!explicit && canRead(perm));
  const endRef = useRef<HTMLDivElement>(null);

  const roomMsgs = messages.filter((m) => m.room === room).sort((a, b) => a.ts - b.ts);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [roomMsgs.length, room]);

  const send = () => {
    if (!text.trim()) return;
    Store.saveChat([
      ...Store.listChat(),
      { id: newId(), room, from: user.email, fromName: user.name, role: user.role, text: text.trim(), ts: Date.now() },
    ]);
    setText("");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Card className="overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[440px]">
        <div className="border-b border-border flex overflow-x-auto">
          {visibleRooms.map((r) => (
            <button key={r.id} onClick={() => setRoom(r.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-smooth ${room === r.id ? "border-b-2 border-accent text-primary" : "text-muted-foreground hover:text-primary"}`}>
              # {r.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
          {roomMsgs.map((m) => {
            const mine = m.from === user.email;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
                  {!mine && <div className="text-[11px] font-semibold text-accent capitalize">{m.fromName} · {m.role}</div>}
                  <div className="text-sm break-words">{m.text}</div>
                  <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.ts).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {!roomMsgs.length && <div className="text-center text-sm text-muted-foreground py-8">No messages yet — say hi 👋</div>}
          <div ref={endRef} />
        </div>

        {canSend && (
          <div className="border-t border-border p-3 flex gap-2">
            <Input placeholder="Type a message..." value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()} />
            <Button variant="hero" onClick={send}><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground mt-2">Messages sync live across tabs via localStorage events.</p>
    </div>
  );
};

export default ChatModule;
