import { InteractiveJudgeDemo } from "./interactive-demo";
import { WaitlistForm } from "./waitlist-form";

export function HeroSection() {
  return (
    <section className="hero" id="demo">
      <div className="hero-noise" aria-hidden="true" />
      <div className="hero-copy">
        <span className="joined-pill">
          <i aria-hidden="true" />
          37 people joined yesterday
        </span>
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
