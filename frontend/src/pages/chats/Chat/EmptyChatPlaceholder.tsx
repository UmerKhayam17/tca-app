/**
 * components/Chat/EmptyChatPlaceholder.jsx
 * WhatsApp-exact empty state
 */

import React from "react";
import { LockKeyhole } from "lucide-react";

export default function EmptyChatPlaceholder() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{ background: "#f0f2f5" }}
    >
      {/* Large illustration area */}
      <div className="flex flex-col items-center text-center px-8 max-w-md">
        {/* WA-style laptop/phone illustration placeholder */}
        <div
          className="w-64 h-64 rounded-full flex items-center justify-center mb-8"
          style={{ background: "rgba(0,0,0,0.04)" }}
        >
          <svg viewBox="0 0 200 200" width="180" height="180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="#dfe5e7" opacity="0.5" />
            <rect x="45" y="65" width="110" height="80" rx="8" fill="#fff" stroke="#c4cdd3" strokeWidth="2" />
            <rect x="55" y="75" width="90" height="55" rx="4" fill="#eae6df" />
            <rect x="65" y="82" width="50" height="8" rx="4" fill="#d9fdd3" />
            <rect x="85" y="96" width="55" height="8" rx="4" fill="#fff" />
            <rect x="65" y="110" width="40" height="8" rx="4" fill="#d9fdd3" />
            <circle cx="100" cy="155" r="6" fill="#c4cdd3" />
            <rect x="75" y="159" width="50" height="4" rx="2" fill="#c4cdd3" />
          </svg>
        </div>

        <h3
          className="text-[32px] font-[300] mb-3"
          style={{ color: "#41525d", fontWeight: 300 }}
        >
          Academy Chat
        </h3>
        {/* End-to-end encryption notice — exactly like WA */}
        <div className="flex items-center gap-1.5">
          <LockKeyhole size={12} style={{ color: "#8696a0" }} />
          <span className="text-[12.5px]" style={{ color: "#8696a0" }}>
            Your personal messages are end-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  );
}