import { InteractiveJudgeDemo } from "./interactive-demo";
import { JoinedCount } from "./joined-count";
import { WaitlistForm } from "./waitlist-form";

/**
 * Deliberately NOT async. `landing-page.tsx` is a "use client" component, so an
 * async component here sits inside a client boundary: React cannot suspend on
 * the returned promise, throws "Creating promises inside a Client Component is
 * not yet supported", and hydration dies for the ENTIRE page. Every button and
 * tab silently stops working while the markup still looks correct.
 * The count is fetched in app/page.tsx, which is a real Server Component, and
 * threaded down as a prop.
 */
export function HeroSection({ waitlistCount }: { waitlistCount: number }) {
  return (
    <section className="hero" id="demo">
      <div className="hero-noise" aria-hidden="true" />
      <div className="hero-copy">
        <JoinedCount initial={waitlistCount} />
        <h1>Learning languages just became an e-sport.</h1>
        <p className="hero-subhead">
          Ranked matches to see your skills in action, your avatar speedruns your fluency, and a global community keeps you climbing together.
        </p>

        <WaitlistForm />

        <div className="hero-proof" aria-label="Core match metrics">
          <span><b>2</b> players per prompt</span>
          <i />
          <span><b>1</b> blind judge</span>
          <i />
          <span><b>10,000</b> FS ladder</span>
        </div>
      </div>

      <div className="hero-arena">
        <InteractiveJudgeDemo />
      </div>
    </section>
  );
}
