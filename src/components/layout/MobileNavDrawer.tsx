"use client";
/**
 * MobileNavDrawer — slide-in sidebar overlay for mobile screens.
 *
 * Opens and closes in response to the "mobile-nav-toggle" CustomEvent
 * dispatched by the hamburger button in Topbar. Also closes on:
 *   - Clicking the backdrop
 *   - Pressing Escape
 *
 * The drawer renders as a fixed overlay so it can live anywhere in the tree
 * without disturbing the grid layout. Children are RSC-rendered sidebar
 * content (logo, identity block, nav links) passed from the parent server
 * layout — no permission data crosses the client/server boundary here.
 */
import { useState, useEffect, useRef, type ReactNode } from "react";

export function MobileNavDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Respond to hamburger-button toggle events
  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener("mobile-nav-toggle", toggle);
    return () => window.removeEventListener("mobile-nav-toggle", toggle);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="mobile-nav-overlay">
      {/* Backdrop */}
      <div
        className="mobile-nav-backdrop"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className="mobile-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button row */}
        <div className="mobile-nav-close-row">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mobile-nav-close-btn"
            aria-label="Close navigation"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px" }}
              aria-hidden="true"
            >
              close
            </span>
          </button>
        </div>

        {/* RSC sidebar children — flex column so flex-1 works inside */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
