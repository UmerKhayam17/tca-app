/**
 * components/Message/EmojiPicker.jsx
 * Lightweight emoji picker (no heavy library needed).
 */

import React, { useEffect, useRef, useState } from "react";

const CATEGORIES = {
  "😀 Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓"],
  "👍 Gestures": ["👍","👎","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👋","🤚","🖐","✋","🖖","👏","🙌","🤲","🤝","🙏","✍️","💪","🦾","🦿","🦵","🦶"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","☪️"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄"],
  "🎉 Activities": ["🎉","🎊","🎈","🎁","🎀","🎗","🎟","🎫","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🥏","🎱","🏓","🏸","🥊","🥋","🎯","🎳","🏹","🎣"],
  "🍕 Food": ["🍕","🍔","🌮","🌯","🥙","🧆","🥚","🍳","🥘","🍲","🥗","🍿","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡"],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  const [active, setActive] = useState(Object.keys(CATEGORIES)[0]);

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
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden"
    >
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 px-2 pt-2 gap-1">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`text-base px-1.5 py-1 rounded-lg flex-shrink-0 transition-colors ${
              active === cat ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            {cat.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 max-h-48 overflow-y-auto">
        <p className="text-[10px] text-gray-400 mb-1 px-1">{active.split(" ").slice(1).join(" ")}</p>
        <div className="grid grid-cols-8 gap-0.5">
          {CATEGORIES[active].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-xl p-1 hover:bg-gray-100 rounded-lg transition-colors leading-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}