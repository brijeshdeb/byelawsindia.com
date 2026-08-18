"use client";
/**
 * CookieBanner — public landing page only.
 *
 * Shows once to first-time visitors. Dismissed state is stored in localStorage
 * (key: "byelawsindia_cookie_consent") so the banner never appears again
 * after the user accepts.
 *
 * Uses only strictly-necessary auth session cookies, so no "Decline" option
 * is offered — declining auth cookies would break the login flow entirely.
 * The banner is transparency disclosure, not a consent gate.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "byelawsindia_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage blocked (private browsing, etc.) — silently hide
    }
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    } catch {
      // ignore write failure
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#1E1E1E",
        borderTop: "1px solid #333333",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px 20px",
        }}
      >
        {/* Icon */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "rgba(16,185,129,0.12)",
            color: "#10B981",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v4M8 10.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>

        {/* Text */}
        <p
          style={{
            flex: "1 1 280px",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "#9CA3AF",
            margin: 0,
          }}
        >
          This site uses cookies to keep you signed in. We do not use advertising or
          tracking cookies.{" "}
          <Link
            href="/privacy"
            style={{ color: "#10B981", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            Privacy policy
          </Link>
        </p>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          style={{
            flexShrink: 0,
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 20px",
            borderRadius: "6px",
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
