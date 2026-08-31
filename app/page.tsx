import { LandingPage } from "@/components/landing-page";
import { getWaitlistCount } from "@/lib/waitlist-count";

/**
 * The hero renders a live waitlist count, so this page cannot be fully static.
 * 60s ISR rather than force-dynamic: the person who just signed up sees their
 * own increment immediately (the form bumps it client-side), and everyone else
 * sees a number at most a minute stale. That keeps the landing page cacheable.
 */
export const revalidate = 60;

export default async function Home() {
  // The only place this may be awaited: page.tsx is a Server Component, while
  // LandingPage below it is "use client".
  const waitlistCount = await getWaitlistCount();
  return <LandingPage waitlistCount={waitlistCount} />;
}
