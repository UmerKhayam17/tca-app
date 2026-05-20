/**
 * components/Conversation/ConversationInfoDrawer.jsx
 *
 * MODIFICATIONS:
 *  - Added "Allow message editing" toggle in Settings tab
 *  - Added "Edit time limit (minutes)" numeric input — 0 = unlimited
 *    After the set minutes have passed, the Edit option is hidden from the message context menu.
 *    The `conversationSetting.allowEditing` and `conversationSetting.editTimeLimit` values
 *    are broadcast via socket "conversation:updated" just like every other setting.
 *
 * NOTE: You must also add `allowEditing` (Boolean, default true) and
 *       `editTimeLimit` (Number, default 0) to the Mongoose conversation schema's
 *       `settings` sub-doc, and whitelist them in `updateGroupSettings` controller.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X, LogOut, Image, File, Users, Settings,
  ToggleLeft, ToggleRight, UserPlus, Search,
  Shield, ShieldOff, Trash2, Crown, ChevronDown,
  Check, AlertTriangle, UserMinus, Clock,
} from "lucide-react";
import UserAvatar   from "../Shared/UserAvatar";
import api          from "@/services/socket/chat.api";
import {
  useChatUi,
  useConversations,
  useChatMutations,
  updateConversationMeta,
  userIdStr,
} from "@/services/socket/chat.api";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────

function SettingToggle({ label, description, value, onChange, disabled }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{ borderBottom: "1px solid #f0f2f5" }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[14px] font-medium" style={{ color: "#111b21" }}>{label}</p>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ color: "#8696a0" }}>{description}</p>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`flex-shrink-0 transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {value
          ? <ToggleRight size={28} style={{ color: "#00a884" }} />
          : <ToggleLeft  size={28} style={{ color: "#c4cdd3" }} />
        }
      </button>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div
      className="px-5 py-3"
      style={{ borderBottom: "1px solid #f0f2f5", background: "#f9fafb" }}
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: "#8696a0" }}>
        {title}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditTimeLimitInput — inline numeric input for the edit window (minutes)
// ─────────────────────────────────────────────────────────────────────────────
function EditTimeLimitInput({ value, onChange, disabled }) {
  const [localVal, setLocalVal] = useState(String(value ?? 0));
  const debounceRef = useRef(null);

  // Keep in sync if parent changes
  useEffect(() => {
    setLocalVal(String(value ?? 0));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setLocalVal(raw);
    const parsed = parseInt(raw || "0", 10);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(parsed), 600);
  };

  return (
    <div
      className="flex items-start gap-3 px-5 py-3.5"
      style={{ borderBottom: "1px solid #f0f2f5" }}
    >
      <Clock size={18} style={{ color: "#00a884", marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium mb-0.5" style={{ color: "#111b21" }}>
          Edit time limit
        </p>
        <p className="text-[12px] mb-2" style={{ color: "#8696a0" }}>
          Minutes after which editing is no longer allowed. Set to 0 for unlimited.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="10080"
            value={localVal}
            onChange={handleChange}
            disabled={disabled}
            className="w-24 text-[14px] outline-none rounded-lg px-3 py-1.5 disabled:opacity-40"
            style={{
              border: "1.5px solid #e9edef",
              color: "#111b21",
              background: disabled ? "#f9fafb" : "#fff",
            }}
          />
          <span className="text-[12.5px]" style={{ color: "#8696a0" }}>
            {parseInt(localVal || "0") === 0 ? "Unlimited" :
             parseInt(localVal || "0") === 1 ? "1 minute" :
             `${localVal} minutes`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Members Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddMembersPanel({ conv, onClose, onAdded }) {
  const [query,   setQuery]   = useState("");
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef(null);

  const existingIds = new Set(
    conv.participants.map((p) => p.userId?._id || p.userId)
  );

  useEffect(() => {
    inputRef.current?.focus();
    fetchUsers("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  const fetchUsers = async (q) => {
    setLoading(true);
    try {
      const res = await api.searchUsers(q);
      setUsers((res.users || []).filter((u) => !existingIds.has(u._id)));
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const toggle = (u) =>
    setSelected((prev) =>
      prev.find((s) => s._id === u._id)
        ? prev.filter((s) => s._id !== u._id)
        : [...prev, u]
    );

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      await onAdded(selected.map((u) => u._id));
      onClose();
    } catch { }
    finally { setSaving(false); }
  };

  return (
    <div
      className="absolute top-[59px] left-0 right-0 bottom-0 z-10 flex flex-col bg-white"
      style={{ animation: "waSlideIn 0.18s ease-out" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ background: "#008069", minHeight: 59 }}
      >
        <button onClick={onClose} className="text-white/90 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-white font-medium text-[17px] flex-1">Add members</h3>
        {selected.length > 0 && (
          <button
            onClick={handleAdd}
            disabled={saving}
            className="text-white bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? "Adding…" : `Add (${selected.length})`}
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #f0f2f5" }}>
          {selected.map((u) => (
            <span
              key={u._id}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px]"
              style={{ background: "#00a884", color: "#fff" }}
            >
              {u.name}
              <button onClick={() => toggle(u)} className="ml-0.5 opacity-80 hover:opacity-100">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid #f0f2f5" }}>
        <div className="flex items-center gap-2 rounded-lg px-3" style={{ background: "#f0f2f5", height: 36 }}>
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

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>Searching…</div>
        )}
        {!loading && users.length === 0 && (
          <div className="py-8 text-center text-[13px]" style={{ color: "#8696a0" }}>No users found</div>
        )}
        {!loading && users.map((u) => {
          const isSel = !!selected.find((s) => s._id === u._id);
          return (
            <button
              key={u._id}
              onClick={() => toggle(u)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f5f6f6] transition-colors"
              style={{ borderBottom: "1px solid #f0f2f5" }}
            >
              <UserAvatar name={u.name} avatarUrl={u.profile_image} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] truncate" style={{ color: "#111b21" }}>{u.name}</p>
                <p className="text-[12.5px] truncate" style={{ color: "#8696a0" }}>{u.designation || u.email}</p>
              </div>
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                style={{
                  background:  isSel ? "#00a884" : "transparent",
                  borderColor: isSel ? "#00a884" : "#c4cdd3",
                }}
              >
                {isSel && <Check size={13} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Admin Modal
// ─────────────────────────────────────────────────────────────────────────────
function AssignAdminModal({ conv, myId, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null);
  const others = conv.participants.filter(
    (p) => (p.userId?._id || p.userId) !== myId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="bg-white w-full max-w-[420px] rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "70vh", animation: "slideUp 0.22s ease-out" }}
      >
        <div className="px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid #f0f2f5" }}>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
            <h3 className="text-[16px] font-semibold" style={{ color: "#111b21" }}>
              Assign a new admin
            </h3>
          </div>
          <p className="text-[13px]" style={{ color: "#8696a0" }}>
            You're the only admin. Select a member to become admin before you leave.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {others.map((p) => {
            const u   = p.userId;
            const uid = u?._id || u;
            const isSel = selected === uid;
            return (
              <button
                key={uid}
                onClick={() => setSelected(uid)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f5f6f6] transition-colors"
                style={{ borderBottom: "1px solid #f0f2f5" }}
              >
                <UserAvatar name={u?.name || "?"} avatarUrl={u?.profile_image} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] truncate" style={{ color: "#111b21" }}>{u?.name || "Unknown"}</p>
                  <p className="text-[12.5px] truncate" style={{ color: "#8696a0" }}>{u?.designation || u?.email || ""}</p>
                </div>
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                  style={{
                    background:  isSel ? "#00a884" : "transparent",
                    borderColor: isSel ? "#00a884" : "#c4cdd3",
                  }}
                >
                  {isSel && <Check size={13} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid #f0f2f5" }}>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-colors hover:bg-[#f0f2f5]"
            style={{ border: "1px solid #e9edef", color: "#3b4a54" }}
          >
            Cancel
          </button>
          <button
            disabled={!selected}
            onClick={() => onConfirm(selected)}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ background: "#00a884" }}
          >
            Make admin & Leave
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform:translateY(60px); opacity:0 } to { transform:translateY(0); opacity:1 } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Member context menu
// ─────────────────────────────────────────────────────────────────────────────
function MemberMenu({ participant, conv, myId, isMyAdmin, isCreator, onClose }) {
  const { removeParticipant, changeParticipantRole } = useChatMutations();
  const [busy, setBusy] = useState(false);

  const u        = participant.userId;
  const uid      = u?._id || u;
  const isSelf   = uid === myId;
  const isTarget = participant.role === "admin";

  const canRemove  = !isSelf && isMyAdmin && (!isTarget || isCreator);
  const canPromote = !isSelf && isMyAdmin && !isTarget;
  const canDemote  = !isSelf && isMyAdmin && isTarget && isCreator;

  const handle = async (action) => {
    setBusy(true);
    try {
      if (action === "remove") {
        await removeParticipant.mutateAsync({ conversationId: conv._id, targetUserId: uid });
      } else if (action === "make-admin") {
        await changeParticipantRole.mutateAsync({ conversationId: conv._id, targetUserId: uid, role: "admin" });
      } else if (action === "remove-admin") {
        await changeParticipantRole.mutateAsync({ conversationId: conv._id, targetUserId: uid, role: "member" });
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (!canRemove && !canPromote && !canDemote) return null;

  return (
    <div
      className="absolute right-4 top-2 z-20 bg-white rounded-lg shadow-xl border border-[#e9edef] overflow-hidden"
      style={{ minWidth: 180 }}
      onClick={(e) => e.stopPropagation()}
    >
      {canPromote && (
        <button
          disabled={busy}
          onClick={() => handle("make-admin")}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] hover:bg-[#f5f6f6] transition-colors text-left disabled:opacity-50"
          style={{ color: "#111b21" }}
        >
          <Shield size={15} style={{ color: "#00a884" }} />
          Make group admin
        </button>
      )}
      {canDemote && (
        <button
          disabled={busy}
          onClick={() => handle("remove-admin")}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] hover:bg-[#f5f6f6] transition-colors text-left disabled:opacity-50"
          style={{ color: "#111b21" }}
        >
          <ShieldOff size={15} style={{ color: "#8696a0" }} />
          Dismiss as admin
        </button>
      )}
      {canRemove && (
        <button
          disabled={busy}
          onClick={() => handle("remove")}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] hover:bg-red-50 transition-colors text-left disabled:opacity-50"
          style={{ color: "#ef4444" }}
        >
          <UserMinus size={15} />
          Remove from group
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Drawer
// ─────────────────────────────────────────────────────────────────────────────
export default function ConversationInfoDrawer({ conversation: convProp, onClose }) {
  const qc = useQueryClient();
  const { myId, presenceMap } = useChatUi();
  const { data: conversations = [] } = useConversations();
  const { addParticipants, leaveGroup, deleteGroup } = useChatMutations();
  const conv =
    conversations.find((c) => String(c._id) === String(convProp._id)) || convProp;

  const API_URL = import.meta.env.VITE_API_URL?.trim() || "";

  const [tab,        setTab]        = useState("members");
  const [media,      setMedia]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [settings,   setSettings]   = useState(conv.settings || {});
  const [showAdd,    setShowAdd]    = useState(false);
  const [openMenu,   setOpenMenu]   = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (conv.settings) setSettings(conv.settings);
  }, [conv.settings]);

  const isDirect   = conv.type === "direct";
  const other      = isDirect
    ? conv.participants?.find((p) => userIdStr(p.userId) !== userIdStr(myId))
    : null;
  const displayName = isDirect ? (other?.userId?.name || "Unknown") : (conv.title || "Group");
  const avatarUrl   = isDirect ? other?.userId?.profile_image : conv.avatar;

  const myParticipant = conv.participants?.find(
    (p) => userIdStr(p.userId) === userIdStr(myId)
  );
  const isAdmin    = myParticipant?.role === "admin";
  const isCreator  = userIdStr(conv.createdBy) === userIdStr(myId);
  const adminCount = conv.participants?.filter((p) => p.role === "admin").length || 0;

  const canAddMembers = !isDirect && (
    isAdmin || !conv.settings?.onlyAdminsCanAddMembers
  );

  const handleSettingChange = async (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setSaving(true);
    try {
      await api.updateGroupSettings(conv._id, { [key]: val });
      updateConversationMeta(qc, conv._id, { settings: next });
    } catch (e) {
      console.error("Setting update failed", e);
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMembers = async (userIds) => {
    setError("");
    try {
      await addParticipants.mutateAsync({ conversationId: conv._id, userIds });
    } catch (e) {
      setError(typeof e === "string" ? e : "Failed to add members");
      throw e;
    }
  };

  const handleLeave = async (newAdminId = null) => {
    setBusy(true);
    setError("");
    try {
      await leaveGroup.mutateAsync({ conversationId: conv._id, newAdminId });
      onClose();
    } catch (e) {
      const errData = typeof e === "object" ? e : { error: e };
      if (errData?.requiresAdminAssignment) {
        setShowAssign(true);
      } else {
        setError(errData?.error || "Failed to leave group");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group for everyone? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await deleteGroup.mutateAsync(conv._id);
      onClose();
    } catch (e) {
      setError(typeof e === "string" ? e : "Failed to delete group");
    } finally {
      setBusy(false);
    }
  };

  const loadMedia = async (type) => {
    setTab(type);
    try {
      const res = await api.getMedia(conv._id, type);
      setMedia(res.media || []);
    } catch { setMedia([]); }
  };

  const tabs = [
    { id: "members",  label: "Members",  icon: Users    },
    { id: "media",    label: "Media",    icon: Image    },
    { id: "files",    label: "Files",    icon: File     },
    ...(!isDirect && isAdmin ? [{ id: "settings", label: "Settings", icon: Settings }] : []),
  ];

  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenu]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        className="relative flex flex-col h-full shadow-2xl overflow-hidden"
        style={{ width: 360, background: "#fff", animation: "waSlideIn 0.2s ease-out" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 flex-shrink-0"
          style={{ background: "#008069", minHeight: 59 }}
        >
          <button onClick={onClose} className="text-white/90 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-white font-medium text-[17px]">
            {isDirect ? "Contact info" : "Group info"}
          </h3>
        </div>

        {/* Add Members Panel */}
        {showAdd && (
          <AddMembersPanel
            conv={conv}
            onClose={() => setShowAdd(false)}
            onAdded={handleAddMembers}
          />
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Profile section */}
          <div
            className="flex flex-col items-center py-8 px-5"
            style={{ background: "#f0f2f5", borderBottom: "8px solid #e9edef" }}
          >
            <UserAvatar name={displayName} avatarUrl={avatarUrl} size={80} isGroup={!isDirect} />
            <h4 className="font-semibold text-[19px] mt-4 text-center" style={{ color: "#111b21" }}>
              {displayName}
            </h4>
            {!isDirect && (
              <p className="text-[14px] mt-1" style={{ color: "#8696a0" }}>
                Group · {conv.participants?.length} member{conv.participants?.length !== 1 ? "s" : ""}
              </p>
            )}
            {isDirect && other?.userId?.designation && (
              <p className="text-[14px] mt-1 text-center" style={{ color: "#8696a0" }}>
                {other.userId.designation}
              </p>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mx-4 my-3 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              <AlertTriangle size={15} />
              {error}
              <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid #e9edef" }}>
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive =
                tab === id ||
                (id === "media" && tab === "image") ||
                (id === "files" && tab === "file");
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "media") loadMedia("image");
                    else if (id === "files") loadMedia("file");
                    else setTab(id);
                  }}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
                  style={{
                    borderBottom: isActive ? "2px solid #00a884" : "2px solid transparent",
                    color: isActive ? "#00a884" : "#8696a0",
                  }}
                >
                  <Icon size={18} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          {/* MEMBERS TAB */}
          {tab === "members" && (
            <div>
              {canAddMembers && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#f5f6f6] transition-colors"
                  style={{ borderBottom: "1px solid #f0f2f5" }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#00a884" }}
                  >
                    <UserPlus size={20} className="text-white" />
                  </div>
                  <span className="text-[15px] font-medium" style={{ color: "#00a884" }}>
                    Add members
                  </span>
                </button>
              )}

              {conv.participants?.map((p) => {
                const u   = p.userId;
                const uid = u?._id || u;
                if (!uid) return null;
                const presence = presenceMap[uid]?.status || u?.onlineStatus || "offline";
                const isOnline = presence === "online";
                const isSelf   = uid === myId || uid?.toString() === myId?.toString();

                return (
                  <div
                    key={uid}
                    className="relative flex items-center gap-3 px-5 py-3 hover:bg-[#f5f6f6] transition-colors"
                    style={{ borderBottom: "1px solid #f0f2f5" }}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar name={u?.name || "?"} avatarUrl={u?.profile_image} size={46} />
                      {isOnline && (
                        <span
                          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
                          style={{ width: 11, height: 11, background: "#25d366" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[15px] truncate font-medium" style={{ color: "#111b21" }}>
                          {u?.name || "Unknown"}{isSelf ? " (You)" : ""}
                        </p>
                        {p.role === "admin" && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                            style={{ background: "#e7f8f3", color: "#00a884" }}
                          >
                            Admin
                          </span>
                        )}
                        {conv.createdBy?.toString() === uid?.toString() && (
                          <Crown size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
                        )}
                      </div>
                      <p className="text-[12.5px] truncate" style={{ color: "#8696a0" }}>
                        {u?.designation || u?.email || ""}
                      </p>
                    </div>

                    {/* 3-dot menu */}
                    {!isSelf && isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === uid ? null : uid); }}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
                        style={{ color: "#8696a0" }}
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}

                    {openMenu === uid && (
                      <MemberMenu
                        participant={p}
                        conv={conv}
                        myId={myId}
                        isMyAdmin={isAdmin}
                        isCreator={isCreator}
                        onClose={() => setOpenMenu(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SETTINGS TAB — with new editing controls */}
          {tab === "settings" && !isDirect && isAdmin && (
            <div>
              <SectionHeader title="Messaging" />

              <SettingToggle
                label="Only admins can send"
                description="Members cannot send messages; only group admins can."
                value={!!settings.onlyAdminsCanSend}
                onChange={(v) => handleSettingChange("onlyAdminsCanSend", v)}
                disabled={saving}
              />

              <SettingToggle
                label="Only admins can add members"
                description="Restricts adding new members to group admins only."
                value={!!settings.onlyAdminsCanAddMembers}
                onChange={(v) => handleSettingChange("onlyAdminsCanAddMembers", v)}
                disabled={saving}
              />

              <SettingToggle
                label="Allow file sharing"
                description="Members can share files, images, and media."
                value={settings.allowFileSharing !== false}
                onChange={(v) => handleSettingChange("allowFileSharing", v)}
                disabled={saving}
              />

              <SettingToggle
                label="Allow reactions"
                description="Members can react to messages with emojis."
                value={settings.allowReactions !== false}
                onChange={(v) => handleSettingChange("allowReactions", v)}
                disabled={saving}
              />

              <SettingToggle
                label="Allow replies"
                description="Members can reply to individual messages."
                value={settings.allowReplies !== false}
                onChange={(v) => handleSettingChange("allowReplies", v)}
                disabled={saving}
              />

              <SettingToggle
                label="Allow forwarding"
                description="Members can forward messages to other conversations."
                value={settings.allowForwarding !== false}
                onChange={(v) => handleSettingChange("allowForwarding", v)}
                disabled={saving}
              />

              {/* ── NEW: Message Editing section ── */}
              <SectionHeader title="Message Editing" />

              <SettingToggle
                label="Allow message editing"
                description="Members can edit their sent messages."
                value={settings.allowEditing !== false}
                onChange={(v) => handleSettingChange("allowEditing", v)}
                disabled={saving}
              />

              {/* Only show the time-limit control when editing is enabled */}
              {settings.allowEditing !== false && (
                <EditTimeLimitInput
                  value={settings.editTimeLimit ?? 0}
                  onChange={(v) => handleSettingChange("editTimeLimit", v)}
                  disabled={saving}
                />
              )}

              <SectionHeader title="Retention" />

              <div className="px-5 py-4" style={{ borderBottom: "1px solid #f0f2f5" }}>
                <p className="text-[14px] font-medium mb-2" style={{ color: "#111b21" }}>
                  Disappearing messages
                </p>
                <p className="text-[12px] mb-3" style={{ color: "#8696a0" }}>
                  Messages auto-delete after the selected time. 0 = off.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Off",     value: 0       },
                    { label: "1 day",   value: 86400   },
                    { label: "7 days",  value: 604800  },
                    { label: "30 days", value: 2592000 },
                  ].map(({ label, value }) => {
                    const isActive = (settings.disappearingMessages || 0) === value;
                    return (
                      <button
                        key={value}
                        disabled={saving}
                        onClick={() => handleSettingChange("disappearingMessages", value)}
                        className="px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors"
                        style={{
                          background: isActive ? "#00a884" : "#f0f2f5",
                          color:      isActive ? "#fff"    : "#3b4a54",
                          border:     `1px solid ${isActive ? "#00a884" : "#e9edef"}`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {saving && (
                <p className="text-[12px] text-center py-2" style={{ color: "#8696a0" }}>Saving…</p>
              )}
            </div>
          )}

          {/* MEDIA / FILES TABS */}
          {(tab === "image" || tab === "file") && (
            <div className="p-3">
              {!media && (
                <p className="text-[13px] text-center py-8" style={{ color: "#8696a0" }}>Loading…</p>
              )}
              {media?.length === 0 && (
                <p className="text-[13px] text-center py-8" style={{ color: "#8696a0" }}>Nothing here yet</p>
              )}
              {tab === "image" && media?.length > 0 && (
                <div className="grid grid-cols-3 gap-1">
                  {media.map((m) => (
                    <img
                      key={m._id}
                      src={API_URL + m.file?.url}
                      alt=""
                      className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(API_URL + m.file?.url, "_blank")}
                    />
                  ))}
                </div>
              )}
              {tab === "file" && media?.length > 0 && (
                <div className="space-y-1">
                  {media.map((m) => (
                    <a
                      key={m._id}
                      href={m.file?.url}
                      download
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5f6f6] transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#00a884" }}
                      >
                        <File size={16} className="text-white" />
                      </div>
                      <span className="text-[13.5px] truncate" style={{ color: "#111b21" }}>
                        {m.file?.name}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isDirect && (
          <div
            className="flex-shrink-0 flex flex-col gap-1"
            style={{ borderTop: "1px solid #e9edef", padding: "10px 12px" }}
          >
            <button
              onClick={() => {
                if (isAdmin && adminCount === 1) {
                  setShowAssign(true);
                } else {
                  if (window.confirm("Leave this group?")) handleLeave();
                }
              }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut size={18} className="text-red-500" />
              <span className="text-[14.5px] font-medium text-red-500">Exit group</span>
            </button>

            {isCreator && (
              <button
                onClick={handleDeleteGroup}
                disabled={busy}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} className="text-red-600" />
                <span className="text-[14.5px] font-medium text-red-600">Delete group</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showAssign && (
        <AssignAdminModal
          conv={conv}
          myId={myId}
          onConfirm={(newAdminId) => {
            setShowAssign(false);
            handleLeave(newAdminId);
          }}
          onCancel={() => setShowAssign(false)}
        />
      )}

      <style>{`
        @keyframes waSlideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}