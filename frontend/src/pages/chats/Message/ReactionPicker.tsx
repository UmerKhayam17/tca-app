/**
 * components/Message/ReactionPicker.jsx
 * WhatsApp-exact quick reaction bar
 */

import React, { useEffect, useRef } from "react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "✅"];

export default function ReactionPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-[3px] rounded-full px-2.5 py-1.5"
      style={{
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        border: "1px solid #f0f2f5",
      }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-[20px] leading-none p-0.5 hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}