/**
 * components/Conversation/NewGroupModal.jsx
 * WhatsApp-exact new group modal
 */

import React, { useState, useEffect } from "react";
import { Search, Check, ArrowLeft, ArrowRight, X } from "lucide-react";
import api, { useCreateGroup } from "@/services/socket/chat.api";
import UserAvatar    from "../Shared/UserAvatar";

export default function NewGroupModal({ onClose }) {
  const createGroup = useCreateGroup();
  const [step,     setStep]     = useState(1);
  const [query,    setQuery]    = useState("");
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState([]);
  const [title,    setTitle]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchUsers(query);
        setUsers(res.users || []);
      } catch { setUsers([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const toggleSelect = (user) => {
    setSelected((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    if (!selected.length) {
      setError("Add at least one member.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await createGroup.mutateAsync({
        title: title.trim(),
        participantIds: selected.map((u) => u._id),
      });
      onClose();
    } catch (e) {
      console.error(e);
      setError(e?.data?.error || e?.message || "Could not create group.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white w-full max-w-[400px] rounded-[3px] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: "#008069", minHeight: 58 }}
        >
          <button onClick={step === 1 ? onClose : () => setStep(1)} className="text-white/90 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-white font-medium text-[17px]">
              {step === 1 ? "Add group members" : "New group"}
            </h3>
            {step === 1 && (
              <p className="text-white/70 text-[12px]">
                {selected.length === 0 ? "Add members" : `${selected.length} of 1024 selected`}
              </p>
            )}
          </div>
        </div>

        {step === 1 && (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 py-2.5" style={{ borderBottom: "1px solid #f0f2f5", background: "#fff" }}>
                {selected.map((u) => (
                  <span
                    key={u._id}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px]"
                    style={{ background: "#00a884", color: "#fff" }}
                  >
                    {u.name}
                    <button onClick={() => toggleSelect(u)} className="ml-0.5 opacity-80 hover:opacity-100">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #f0f2f5" }}>
              <div className="flex items-center gap-2 rounded-lg px-3" style={{ background: "#f0f2f5", height: 36 }}>
                <Search size={15} style={{ color: "#8696a0" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search name or number"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] outline-none"
                  style={{ color: "#3b4a54" }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              {users.map((u) => {
                const isSel = !!selected.find((s) => s._id === u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggleSelect(u)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f5f6f6] transition-colors"
                    style={{ borderBottom: "1px solid #f0f2f5" }}
                  >
                    <UserAvatar name={u.name} avatarUrl={u.profile_image} size={46} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] truncate" style={{ color: "#111b21" }}>{u.name}</p>
                      <p className="text-[13px] truncate" style={{ color: "#8696a0" }}>{u.designation || u.email}</p>
                    </div>
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                      style={{
                        background: isSel ? "#00a884" : "transparent",
                        borderColor: isSel ? "#00a884" : "#c4cdd3",
                      }}
                    >
                      {isSel && <Check size={13} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* FAB-style next button */}
            {selected.length > 0 && (
              <div className="flex justify-end px-5 py-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ background: "#00a884" }}
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col flex-1">
            {/* Group icon + name */}
            <div
              className="flex items-center gap-4 px-5 py-6"
              style={{ borderBottom: "1px solid #f0f2f5" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl cursor-pointer"
                style={{ background: "#f0f2f5" }}
                title="Add group icon"
              >
                📷
              </div>
              <div className="flex-1 border-b-2 border-[#00a884] pb-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Group name (required)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-[16px] outline-none bg-transparent"
                  style={{ color: "#111b21" }}
                  maxLength={100}
                />
              </div>
            </div>

            <p className="text-[13px] px-5 py-3" style={{ color: "#8696a0" }}>
              {selected.length} participant{selected.length !== 1 ? "s" : ""}
            </p>

            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {selected.map((u) => (
                <div key={u._id} className="flex items-center gap-1.5">
                  <UserAvatar name={u.name} avatarUrl={u.profile_image} size={28} />
                  <span className="text-[12.5px]" style={{ color: "#3b4a54" }}>{u.name}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-[13px] px-5 text-red-600">{error}</p>
            )}

            <div className="flex justify-end px-5 py-4 mt-auto">
              <button
                disabled={!title.trim() || creating || !selected.length}
                onClick={handleCreate}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-40 transition-opacity"
                style={{ background: "#00a884" }}
              >
                <Check size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}