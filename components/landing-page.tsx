"use client";

import { useState } from "react";
import { HeroSection } from "./hero-section";
import { ProductWorldGrid } from "./micro-societies";
import { WaitlistForm } from "./waitlist-form";

export function LandingPage() {
  const [showFlags, setShowFlags] = useState(true);

  return (
    <main>
      <HeroSection />

      <section className="world-section" id="world">
        <div className="world-heading-stacked">
          <span className="section-kicker zesty-kicker">
            The Whole Game
            <svg className="kicker-stroke" viewBox="0 0 100 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 5C25 2 75 2 98 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <h2>What&apos;s this all about?</h2>
          <p>
            Click any feature card below to explore how avatar teaching, micro-societies, and global rankings work.
          </p>
        </div>
        <ProductWorldGrid />
      </section>

      <section className="final-cta" id="waitlist">
        <div className="final-rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="final-copy">
          <span className="section-kicker zesty-kicker">
            Your Placement Awaits
            <svg className="kicker-stroke" viewBox="0 0 120 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 5C30 2 90 2 118 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <h2>Your flag belongs on the board.</h2>
          <p>
            Claim your rank now. We will deliver your initial placement match invitation within your language cohort&apos;s launch window.
          </p>
          <WaitlistForm compact onStepChange={(step) => setShowFlags(step === "email")} />
        </div>
        {showFlags ? (
          <div className="flag-stack" aria-hidden="true">
            <span>🇺🇸</span>
            <span>🇮🇳</span>
            <span>🇪🇸</span>
            <span>🇧🇷</span>
            <span>🇯🇵</span>
            <span>🇳🇬</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}
