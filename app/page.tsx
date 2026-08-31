import { LandingPage } from "@/components/landing-page";
import { getWaitlistCount } from "@/lib/waitlist-count";

/**
 * The waitlist count is the page's social proof, so it has to be true on every
 * load. 60s ISR meant a refresh right after signing up still showed the old
 * number, which reads as broken. The query is a single indexed COUNT on a small
 * table, so rendering per-request is cheap; revisit only if traffic makes it
 * measurable.
 */
export const revalidate = 0;

export default async function Home() {
  // The only place this may be awaited: page.tsx is a Server Component, while
  // LandingPage below it is "use client".
  const waitlistCount = await getWaitlistCount();
  return <LandingPage waitlistCount={waitlistCount} />;
}
