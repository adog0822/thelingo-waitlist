"use client";

import { useEffect, useState } from "react";

/** Fired by the waitlist form after a successful signup. */
export const WAITLIST_JOINED_EVENT = "waitlist:joined";

export type WaitlistJoinedDetail = { isNew?: boolean };

/**
 * The hero's social-proof line.
 *
 * The count is server-rendered so there is no flash of a placeholder, then
 * incremented by one in place when a NEW person signs up, so the signer sees
 * their own effect without a reload.
 *
 * It deliberately does not adopt the POST's `signupNumber`. That is the
 * person's rank (offset + row id) and runs ahead of the real population,
 * because `ON CONFLICT DO NOTHING` burns a sequence value on every duplicate
 * submit. Publishing it would inflate the total, and since this only ever
 * increases, a later server read could never correct it.
 *
 * A plain DOM event carries it instead of context or a store: the form and this
 * line sit in different branches of the tree, and one CustomEvent avoids
 * threading a provider through the whole landing page for a single integer.
 */
export function JoinedCount({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);

  // If the server value moves (ISR revalidation, client-side nav), follow it,
  // but never below a number already on screen. Adjusted during render rather
  // than in an effect: React applies this before painting, so there is no
  // cascading second render and no flash of the stale value.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setCount((current) => Math.max(current, initial));
  }

  useEffect(() => {
    function onJoined(event: Event) {
      const detail = (event as CustomEvent<WaitlistJoinedDetail>).detail;
      // Increment by one. Do NOT jump to `signupNumber`: that is the person's
      // RANK (offset + their row id), and ids drift above the population count
      // because `ON CONFLICT DO NOTHING` burns a sequence value on every
      // duplicate submit. Jumping to it would publish an inflated total that
      // the next server read could never walk back, since this only ever
      // increases. `isNew` tells us whether a row was actually added.
      if (detail?.isNew === false) return;
      setCount((current) => current + 1);
    }

    window.addEventListener(WAITLIST_JOINED_EVENT, onJoined);
    return () => window.removeEventListener(WAITLIST_JOINED_EVENT, onJoined);
  }, []);

  return (
    <span className="joined-note">
      {/* Lucide `user-plus`, inlined: the project has no icon dependency and
          one 15px glyph is not worth adding one. */}
      <svg
        className="joined-note-icon"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
      {/* aria-live so the increment is announced once, politely, rather than
          silently changing under a screen reader mid-signup. */}
      <span aria-live="polite">
        <span className="joined-note-value">{count.toLocaleString()}</span>{" "}
        people on the waitlist
      </span>
    </span>
  );
}
