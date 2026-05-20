/**
 * components/Message/FileMessageContent.jsx
 * WhatsApp-exact file/media message style
 */

import React, { useState } from "react";
import { Download, FileText, Music, Film } from "lucide-react";
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const API_URL = import.meta.env.VITE_API_URL?.trim() || "";

export default function FileMessageContent({ message }) {
  const { type, file, text } = message;
  const [imgError, setImgError] = useState(false);

  if (type === "image" && !imgError) {
    return (
      <div className="overflow-hidden rounded-[7px]" style={{ maxWidth: 280 }}>
        <img
          src={`${API_URL}${file?.url}`}
          alt={file?.name || "Image"}
          onError={() => setImgError(true)}
          className="block cursor-pointer hover:opacity-95 transition-opacity"
          style={{ maxWidth: "100%", maxHeight: 300, objectFit: "cover", display: "block" }}
          onClick={() => window.open(`${API_URL}${file?.url}`, "_blank")}
        />
        {text && (
          <p
            className="text-[14.2px] whitespace-pre-wrap break-words leading-[1.45] px-2.5 pt-1.5 pb-1"
            style={{ color: "#111b21" }}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  if (type === "video") {
    return (
      <div style={{ maxWidth: 280 }}>
        <video
          src={file?.url}
          controls
          className="rounded-[7px] block"
          style={{ maxWidth: "100%", maxHeight: 220 }}
        />
        {text && (
          <p className="text-[14.2px] whitespace-pre-wrap break-words leading-[1.45] px-1.5 pt-1.5" style={{ color: "#111b21" }}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="flex items-center gap-2" style={{ minWidth: 220 }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "#00a884" }}
        >
          <Music size={18} className="text-white" />
        </div>
        <audio src={file?.url} controls className="flex-1 h-8" style={{ minWidth: 160 }} />
      </div>
    );
  }

  // Generic file — WA style
  return (
    <a
      href={`${API_URL}${file?.url}`}
      target="_blank"
      rel="noreferrer"
      download={file?.name}
      className="flex items-center gap-3 rounded-[7px] transition-colors"
      style={{
        background: "rgba(0,0,0,0.04)",
        padding: "10px 12px",
        minWidth: 220,
        maxWidth: 300,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#00a884" }}
      >
        <FileText size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-medium truncate leading-snug"
          style={{ color: "#111b21" }}
        >
          {file?.name || "File"}
        </p>
        <p className="text-[11.5px]" style={{ color: "#8696a0" }}>
          {file?.size ? formatBytes(file.size) : ""}
        </p>
      </div>
      <Download size={17} style={{ color: "#8696a0", flexShrink: 0 }} />
    </a>
  );
}