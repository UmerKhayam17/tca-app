/**
 * components/Conversation/NewChatModal.jsx
 * WhatsApp-exact new chat modal
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft } from "lucide-react";
import api, { useGetOrCreateDirect } from "@/services/socket/chat.api";
import UserAvatar from "../Shared/UserAvatar";

export default function NewChatModal({ onClose }) {
  const getOrCreateDirect = useGetOrCreateDirect();
  const [query,   setQuery]   = useState("");
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) { setUsers([]); return; }
      setLoading(true);
      try {
        const res = await api.searchUsers(query);
        setUsers(res.users || []);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (user) => {
    getOrCreateDirect.mutate(user._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-[400px] flex-col overflow-hidden rounded-[3px] bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: "#008069", minHeight: 58 }}
        >
          <button onClick={onClose} className="text-white/90 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-white font-medium text-[17px]">New chat</h3>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #f0f2f5" }}>
          <div
            className="flex items-center gap-2 rounded-lg px-3"
            style={{ background: "#f0f2f5", height: 36 }}
          >
            <Search size={15} style={{ color: "#8696a0" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name or number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] outline-none"
              style={{ color: "#3b4a54" }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>Searching…</div>
          )}
          {!loading && users.length === 0 && query && (
            <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>No contacts found</div>
          )}
          {!loading && users.map((u) => (
            <button
              key={u._id}
              onClick={() => handleSelect(u)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f5f6f6] transition-colors"
              style={{ borderBottom: "1px solid #f0f2f5" }}
            >
              <div className="relative flex-shrink-0">
                <UserAvatar name={u.name} avatarUrl={u.profile_image} size={46} />
                {u.onlineStatus === "online" && (
                  <span
                    className="absolute bottom-0 right-0 rounded-full border-2 border-white"
                    style={{ width: 11, height: 11, background: "#25d366" }}
                  />
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[15px] font-[400] truncate" style={{ color: "#111b21" }}>{u.name}</p>
                <p className="text-[13px] truncate" style={{ color: "#8696a0" }}>{u.designation || u.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}