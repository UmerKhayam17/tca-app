/* components/Message/ContextMenu.jsx */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function ContextMenu({ anchorRef, isOwn, children, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;

    const calculatePosition = () => {
      const anchor = anchorRef.current.getBoundingClientRect();
      const menu = menuRef.current;
      
      if (!menu) return;

      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // ─────────────────────────────────────────────────────────────
      // VERTICAL POSITIONING
      // ─────────────────────────────────────────────────────────────
      let top;
      const spaceAbove = anchor.top;
      const spaceBelow = viewportHeight - anchor.bottom;

      if (spaceAbove >= menuHeight + 10) {
        // Show above
        top = anchor.top - menuHeight - 5;
      } else {
        // Show below
        top = anchor.bottom + 5;
      }

      // ─────────────────────────────────────────────────────────────
      // HORIZONTAL POSITIONING - align with chevron
      // ─────────────────────────────────────────────────────────────
      let left;

      if (isOwn) {
        // Own message: chevron is on LEFT side of bubble
        // Align menu's LEFT edge with chevron's LEFT edge
        left = anchor.left;
        
        // Check if menu would overflow right
        if (left + menuWidth > viewportWidth - 10) {
          // Align menu's RIGHT edge with chevron's LEFT edge
          left = anchor.left - menuWidth;
        }
      } else {
        // Received message: chevron is on RIGHT side of bubble
        // Align menu's RIGHT edge with chevron's RIGHT edge
        left = anchor.right - menuWidth;
        
        // Check if menu would overflow left
        if (left < 10) {
          // Align menu's LEFT edge with chevron's RIGHT edge
          left = anchor.right;
        }
      }

      // Final boundary clamping
      left = Math.max(10, Math.min(left, viewportWidth - menuWidth - 10));
      top = Math.max(10, Math.min(top, viewportHeight - menuHeight - 10));

      setPosition({ top, left });
    };

    // Use setTimeout to ensure menu is rendered before measuring
    const timer = setTimeout(() => {
      calculatePosition();
    }, 0);

    // Also recalculate on scroll/resize
    window.addEventListener("scroll", calculatePosition, true);
    window.addEventListener("resize", calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [anchorRef, isOwn]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const menuElement = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999,
      }}
      className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.22)] border border-gray-100 py-1 min-w-[185px] overflow-hidden"
    >
      {children}
    </div>
  );

  return createPortal(menuElement, document.body);
}

export default ContextMenu;