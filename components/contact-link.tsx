"use client";

import { useEffect, useRef, useState } from "react";

const CONTACT_EMAIL = "lingot228@gmail.com";
const SUBJECT = "Question about TheLingo";

const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;
// Gmail's web compose. Works for anyone signed into Gmail even when the OS has
// no mail client registered at all, which is the case this whole component
// exists for.
const gmailHref =
  `https://mail.google.com/mail/?view=cm&fs=1` +
  `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
  `&su=${encodeURIComponent(SUBJECT)}`;

/**
 * Contact used to be a bare `<a href="mailto:...">`.
 *
 * On desktop that is a dead end: if the OS has no default mail client
 * registered (common on Chrome, and on any machine where Gmail lives in a
 * browser tab) the click does nothing at all. No app opens, no error, no
 * feedback. The only hint the link even exists is the URL in the status bar.
 *
 * So the click now always produces something visible: a small menu offering
 * Gmail in a new tab, the native mail app, or copying the address. Every route
 * to "I can actually email these people" is one click away and none of them can
 * silently no-op.
 */
export function ContactLink() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      // Clipboard API needs a secure context and can be blocked by permissions.
      // Falling back keeps the action from silently failing, which is the exact
      // problem this component was built to remove.
      const field = document.createElement("textarea");
      field.value = CONTACT_EMAIL;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(field);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="contact-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className="contact-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Contact
      </button>

      {open ? (
        <div className="contact-menu" role="menu" aria-label="Contact options">
          <a
            className="contact-menu-item"
            role="menuitem"
            href={gmailHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <span>Open in Gmail</span>
            <span aria-hidden="true">↗</span>
          </a>

          <a
            className="contact-menu-item"
            role="menuitem"
            href={mailtoHref}
            onClick={() => setOpen(false)}
          >
            <span>Open mail app</span>
          </a>

          <button
            type="button"
            className="contact-menu-item"
            role="menuitem"
            onClick={copyAddress}
          >
            <span>{copied ? "Address copied" : "Copy address"}</span>
            <span aria-hidden="true">{copied ? "✓" : ""}</span>
          </button>

          <p className="contact-menu-address">{CONTACT_EMAIL}</p>
          {/* Announced once on copy rather than on every render. */}
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? `${CONTACT_EMAIL} copied to clipboard` : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
