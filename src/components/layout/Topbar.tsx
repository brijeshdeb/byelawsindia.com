"use client";

/**
 * Topbar — Stitch Obsidian design.
 *
 * Surface: #131313 (same as sidebar)
 * Border: #333333
 * Primary/active: #10B981 emerald
 * Icons: Material Symbols Outlined
 */
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

interface Props {
  userName: string;
  userEmail: string;
  /** Short label shown under the user's name. Defaults to "Society Admin". */
  roleLabel?: string;
}

export function Topbar({ userName, userEmail, roleLabel = "Society Admin" }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(userName) || userEmail.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className="app-topbar flex items-center justify-between px-4 sm:px-8"
      style={{ height: "64px", backgroundColor: "#131313", borderBottom: "1px solid #333333" }}
    >
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger — visible only on mobile; dispatches CustomEvent to MobileNavDrawer */}
        <button
          type="button"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded transition-colors"
          style={{ color: "#9CA3AF" }}
          onClick={() => window.dispatchEvent(new CustomEvent("mobile-nav-toggle"))}
          aria-label="Toggle navigation menu"
          aria-haspopup="dialog"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "22px" }}
            aria-hidden="true"
          >
            menu
          </span>
        </button>

        <div className="hidden sm:flex items-center text-sm" style={{ color: "#9CA3AF" }}>
          <span
            className="cursor-pointer transition-colors"
            style={{ color: "#9CA3AF" }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
          >
            Byelawsindia
          </span>
          <span className="material-symbols-outlined mx-1" style={{ fontSize: "16px" }} aria-hidden="true">
            chevron_right
          </span>
          <span style={{ color: "#10B981", fontWeight: 600 }}>Dashboard</span>
        </div>

        {/* Search */}
        <div
          className="hidden lg:flex items-center rounded-full px-4 py-1.5 ml-4 transition-colors"
          style={{ backgroundColor: "#161616", border: "1px solid #333333", width: "256px" }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#333333"; }}
        >
          <span className="material-symbols-outlined mr-2" style={{ fontSize: "18px", color: "#9CA3AF" }} aria-hidden="true">
            search
          </span>
          <input
            className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none w-full"
            style={{ color: "#FFFFFF" }}
            placeholder="Search societies, members…"
            type="text"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-6">

        {/* Notification bell */}
        <button
          type="button"
          className="relative transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#10B981"; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
          aria-label="Notifications (coming soon)"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }} aria-hidden="true">
            notifications
          </span>
          {/* Unread indicator */}
          <span
            className="absolute top-0 right-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#EF4444" }}
          />
        </button>

        {/* Help */}
        <button
          type="button"
          className="transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#10B981"; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
          aria-label="Help"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }} aria-hidden="true">
            help
          </span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px" style={{ backgroundColor: "#333333" }} />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn("flex items-center gap-3 rounded px-2 py-1.5 transition-colors")}
            style={{
              color: "#FFFFFF",
              backgroundColor: menuOpen ? "rgba(255,255,255,0.05)" : "transparent",
            }}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`User menu for ${userName}`}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold select-none shrink-0"
              style={{ backgroundColor: "#10B981" }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold leading-none" style={{ color: "#FFFFFF" }}>
                {userName || userEmail}
              </div>
              <div
                className="text-xs leading-none mt-1"
                style={{ color: "#9CA3AF", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {roleLabel}
              </div>
            </div>
            <span
              className={cn(
                "material-symbols-outlined transition-transform",
                menuOpen && "rotate-180"
              )}
              style={{ fontSize: "18px", color: "#9CA3AF" }}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>

          {/* Dropdown menu — Obsidian Level 2 surface */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-52 z-50 py-1 rounded"
              style={{
                backgroundColor: "#252525",
                border: "1px solid #333333",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #333333" }}>
                <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>
                  {userName || "User"}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#9CA3AF" }}>
                  {userEmail}
                </p>
              </div>

              <Link
                href="/profile"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: "#e5e2e1" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#2a2a2a"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
                onClick={() => setMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
                  person
                </span>
                My Profile
              </Link>

              <Link
                href="/select-context"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: "#e5e2e1" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#2a2a2a"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
                onClick={() => setMenuOpen(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
                  swap_horiz
                </span>
                Switch Context
              </Link>

              <div style={{ borderTop: "1px solid #333333", marginTop: "4px", paddingTop: "4px" }}>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm transition-colors"
                    style={{ color: "#EF4444" }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.08)"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
                      logout
                    </span>
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
