/**
 * components/Message/DateDivider.jsx
 * WhatsApp-exact date pill
 */

import React from "react";
import { format, isToday, isYesterday } from "date-fns";

export function DateDivider({ date }) {
  const d = new Date(date);
  const label = isToday(d)
    ? "TODAY"
    : isYesterday(d)
    ? "YESTERDAY"
    : format(d, "MMMM d, yyyy").toUpperCase();

  return (
    <div className="flex items-center justify-center my-3 px-4">
      <span
        className="text-[12px] font-[500] rounded-lg px-3 py-[5px] shadow-sm"
        style={{
          background: "rgba(255,255,255,0.90)",
          color: "#54656f",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default DateDivider;