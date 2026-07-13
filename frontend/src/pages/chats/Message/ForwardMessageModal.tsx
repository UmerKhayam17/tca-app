/**
 * components/Message/ForwardMessageModal.jsx
 * WhatsApp-exact forward modal
 */

import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ArrowLeft, Forward } from "lucide-react";
import api, { prependConversation } from "@/services/socket/chat.api";
import socketService from "@/services/socket/socket.service";
import UserAvatar from "../Shared/UserAvatar";

export default function ForwardMessageModal({ isOpen, message, onClose }) {
  const qc = useQueryClient();
  const [query,      setQuery]      = useState("");
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setUsers([]);
    setLoading(false);
    setForwarding(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      if (!query.trim()) { setUsers([]); return; }
      setLoading(true);
      try {
        const res = await api.searchUsers(query);
        setUsers(res.users || []);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleForwardToUser = async (user) => {
    if (!message) return;
    setForwarding(true);
    try {
      const res = await api.getOrCreateDirect(user._id);
      const conversation = res.conversation;
      if (!conversation) throw new Error("Unable to open chat.");
      prependConversation(qc, conversation);
      socketService.joinConversation(conversation._id);
      socketService.forwardMessage(
        { messageId: message._id, targetConversationIds: [conversation._id] },
        (ack) => {
          if (!ack?.ok) { window.alert(ack?.error || "Forward failed."); return; }
          onClose?.();
        }
      );
    } catch (err) {
      window.alert(err.message || "Unable to forward message.");
    } finally {
      setForwarding(false);
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-[400px] flex-col overflow-hidden rounded-[3px] bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: "#008069", minHeight: 58 }}
        >
          <button onClick={onClose} className="text-white/90 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-white font-medium text-[17px]">Forward message</h3>
            <p className="text-white/70 text-[12px]">Search to forward</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #f0f2f5" }}>
          <div className="flex items-center gap-2 rounded-lg px-3" style={{ background: "#f0f2f5", height: 36 }}>
            <Search size={15} style={{ color: "#8696a0" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or number"
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ color: "#3b4a54" }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>Searching…</div>
          )}
          {!loading && query.trim() && users.length === 0 && (
            <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>No contacts found</div>
          )}
          {users.map((user) => (
            <button
              key={user._id}
              type="button"
              disabled={forwarding}
              onClick={() => handleForwardToUser(user)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f5f6f6] transition-colors disabled:opacity-60"
              style={{ borderBottom: "1px solid #f0f2f5" }}
            >
              <div className="relative flex-shrink-0">
                <UserAvatar name={user.name} avatarUrl={user.profile_image} size={46} />
                {user.onlineStatus === "online" && (
                  <span
                    className="absolute bottom-0 right-0 rounded-full border-2 border-white"
                    style={{ width: 11, height: 11, background: "#25d366" }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] truncate" style={{ color: "#111b21" }}>{user.name}</p>
                <p className="text-[13px] truncate" style={{ color: "#8696a0" }}>
                  {user.designation || user.email || "Employee"}
                </p>
              </div>
              <Forward size={16} style={{ color: "#8696a0", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}