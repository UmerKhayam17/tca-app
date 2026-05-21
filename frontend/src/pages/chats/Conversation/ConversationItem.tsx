/**
 * components/Conversation/ConversationItem.jsx
 * WhatsApp-exact conversation list item
 */

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatUi, clearUnread, userIdStr } from "@/services/socket/chat.api";
import socketService from "@/services/socket/socket.service";
import UserAvatar    from "../Shared/UserAvatar";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCheck, Check } from "lucide-react";

export default function ConversationItem({ conversation: conv }) {
  const qc = useQueryClient();
  const { myId, activeId, setActiveId, presenceMap, typingMap } = useChatUi();

  const isActive  = activeId === conv._id;
  const typingArr = typingMap[conv._id] || [];

  const isDirect = conv.type === "direct";
  const other    = isDirect
    ? conv.participants?.find((p) => userIdStr(p.userId) !== userIdStr(myId))
    : null;

  const displayName  = isDirect ? (other?.userId?.name || "Unknown") : (conv.title || "Group");
  const avatarUrl    = isDirect
    ? other?.userId?.profile_image || other?.userId?.profileImage
    : conv.avatar;
  const onlineStatus = isDirect
    ? presenceMap[String(other?.userId?._id || other?.userId)]?.status || other?.userId?.onlineStatus || "offline"
    : null;

  const myParticipant = conv.participants?.find(
    (p) => userIdStr(p.userId) === userIdStr(myId)
  );
  const unreadCount   = myParticipant?.unreadCount || 0;

  // Format time like WA: just time if today, else day/date
  const lastTime = conv.lastMessageAt
    ? formatDistanceToNowStrict(new Date(conv.lastMessageAt), { addSuffix: false })
    : "";

  // Determine last message status for tick display
  const lastMsg   = conv.lastMessage || conv.lastMessageId;
  const isMyMsg   = userIdStr(lastMsg?.senderId) === userIdStr(myId);
  const msgStatus = lastMsg?.status;

  const handleClick = () => {
    setActiveId(conv._id);
    clearUnread(qc, conv._id, myId);
    socketService.joinConversation(conv._id);
    socketService.markRead(conv._id);
  };

  const previewText = typingArr.length > 0
    ? null
    : conv.lastMessagePreview || "";

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center text-left transition-colors"
      style={{
        padding: "10px 16px 10px 13px",
        background: isActive ? "#f0f2f5" : "transparent",
        borderBottom: "1px solid #f0f2f5",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f6f6"; }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive ? "#f0f2f5" : "transparent"; }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 mr-3">
        <UserAvatar
          name={displayName}
          avatarUrl={avatarUrl}
          size={49}
          isGroup={!isDirect}
        />
        {isDirect && onlineStatus === "online" && (
          <span
            className="absolute bottom-0 right-0 rounded-full border-2 border-white"
            style={{ width: 12, height: 12, background: "#25d366" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: name + time */}
        <div className="flex items-center justify-between mb-[2px]">
          <span
            className="text-[15px] font-[400] truncate flex-1 mr-2"
            style={{ color: "#111b21", fontWeight: unreadCount ? 600 : 400 }}
          >
            {displayName}
          </span>
          <span
            className="text-[11.5px] flex-shrink-0 tabular-nums"
            style={{ color: unreadCount ? "#00a884" : "#8696a0" }}
          >
            {lastTime}
          </span>
        </div>

        {/* Bottom row: preview + unread badge */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Tick for own last message */}
            {isMyMsg && !typingArr.length && (
              msgStatus === "read"
                ? <CheckCheck size={14} className="flex-shrink-0" style={{ color: "#53bdeb" }} />
                : msgStatus === "delivered"
                ? <CheckCheck size={14} className="flex-shrink-0" style={{ color: "#8696a0" }} />
                : <Check size={14} className="flex-shrink-0" style={{ color: "#8696a0" }} />
            )}

            {typingArr.length > 0 ? (
              <span className="text-[13px] truncate" style={{ color: "#00a884" }}>
                {typingArr.map((t) => t.name).join(", ")} typing…
              </span>
            ) : (
              <span
                className="text-[13px] truncate"
                style={{ color: "#8696a0", fontWeight: unreadCount ? 500 : 400 }}
              >
                {previewText || "No messages yet"}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <span
              className="flex-shrink-0 min-w-[20px] h-5 text-white text-[11.5px] font-semibold rounded-full flex items-center justify-center px-1.5"
              style={{ background: "#00a884" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}