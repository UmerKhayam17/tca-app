/**
 * components/Conversation/ConversationSidebar.jsx
 * WhatsApp-exact sidebar style
 */

import React, { useState } from "react";
import { useConversations, useChatUi, userIdStr } from "@/services/socket/chat.api";
import { Search, MessageSquarePlus, Users2, PanelLeftClose, PanelLeftOpen, MoreVertical } from "lucide-react";
import ConversationItem from "./ConversationItem";
import NewChatModal from "./NewChatModal";
import NewGroupModal from "./NewGroupModal";

export default function ConversationSidebar({ collapsed, setCollapsed }) {
  const { myId } = useChatUi();
  const { data: list = [], isLoading: loading } = useConversations();
  const [search,  setSearch]  = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showGrp, setShowGrp] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = list.filter((c) => {
    const name =
      c.type === "group"
        ? c.title
        : c.participants?.find((p) => userIdStr(p.userId) !== userIdStr(myId))?.userId?.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      className={`${collapsed ? "w-0 overflow-hidden" : "w-[360px]"} transition-all duration-300 flex-shrink-0 flex flex-col h-full`}
      style={{ borderRight: "1px solid #e9edef", background: "#fff" }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ background: "#f0f2f5", height: 59, borderBottom: "1px solid #e9edef" }}
      >
        <h2 className="text-[17px] font-semibold" style={{ color: "#111b21" }}>Chats</h2>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowGrp(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
            style={{ color: "#54656f" }}
            title="New group"
          >
            <Users2 size={20} />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
            style={{ color: "#54656f" }}
            title="New chat"
          >
            <MessageSquarePlus size={20} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
            style={{ color: "#54656f" }}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────── */}
      <div className="px-3 py-2 flex-shrink-0" style={{ background: "#fff" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3"
          style={{
            background: searchFocused ? "#fff" : "#f0f2f5",
            border: searchFocused ? "1px solid #00a884" : "1px solid transparent",
            height: 35,
            transition: "all 0.15s",
          }}
        >
          <Search size={15} style={{ color: "#8696a0", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent text-[13.5px] outline-none"
            style={{ color: "#3b4a54" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ color: "#8696a0" }}
              className="hover:text-[#3b4a54] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── List ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!loading && filtered.map((conv) => (
          <ConversationItem key={conv._id} conversation={conv} />
        ))}
        {!loading && (filtered.length === 0 || search) && (
          <div className="flex items-center justify-center py-10">
            <p className="text-[13px]" style={{ color: "#8696a0" }}>No chats found</p>
          </div>
        )}
      </div>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} />}
      {showGrp && <NewGroupModal onClose={() => setShowGrp(false)} />}
    </div>
  );
}