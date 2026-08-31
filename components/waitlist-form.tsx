"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { ArrowIcon } from "./nav";

type SignupResult = {
  position: number;
  referralCode: string;
  revealPosition: boolean;
  previewMode: boolean;
};

const LANGUAGES = [
  "Spanish",
  "French",
  "Japanese",
  "German",
  "Italian",
  "Mandarin",
  "Portuguese",
  "Another language",
];

const METHODS = [
  "Mobile gamified apps",
  "Textbooks & self-study",
  "Tutors & live classes",
  "Movies, show & podcasts",
];

const FRUSTRATIONS = [
  "Apps feel like games, not speaking practice",
  "Never forced to think or answer under pressure",
  "No accurate judge for real conversational ability",
  "Plateaued at intermediate level with nowhere to test it",
];

export function WaitlistForm({
  compact = false,
  onStepChange,
}: {
  compact?: boolean;
  onStepChange?: (step: "email" | "qualifier" | "success") => void;
}) {
  const [email, setEmail] = useState("");
  const [step, setStepState] = useState<"email" | "qualifier" | "success">("email");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [currentMethod, setCurrentMethod] = useState(METHODS[0]);
  const [previousFrustration, setPreviousFrustration] = useState(FRUSTRATIONS[0]);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function setStep(newStep: "email" | "qualifier" | "success") {
    setStepState(newStep);
    if (onStepChange) onStepChange(newStep);
  }

  const shareUrl = useMemo(() => {
    if (!result) return "";
    if (typeof window === "undefined") return `https://thelingo.app/waitlist?ref=${result.referralCode}`;
    return `${window.location.origin}/waitlist?ref=${result.referralCode}`;
  }, [result]);

  async function handleInitialEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setError("Enter a valid email address so we can send your placement match.");
      inputRef.current?.focus();
      return;
    }
    setStep("qualifier");
  }

  async function submitWaitlistData(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const ref = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("ref") ?? undefined
        : undefined;

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ref,
          targetLanguage,
          currentMethod,
          previousFrustration,
        }),
      });

      const payload = (await response.json()) as SignupResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your placement spot could not be created.");

      setResult(payload);
      setStep("success");
      setStatus("idle");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Your spot could not be saved right now. Please try again.");
    }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(shareUrl);
    setError("Invite link copied to clipboard.");
  }

  async function shareInvite() {
    const data = {
      title: "TheLingo Placement",
      text: "Claim your placement match on TheLingo ranked language leaderboard.",
      url: shareUrl,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(data);
    } else {
      await copyInvite();
    }
  }

  if (step === "success" && result) {
    return (
      <div className={`signup-success ${compact ? "compact" : ""}`} role="status">
        {/* Tactile Confetti Burst Animation */}
        <div className="confetti-burst" aria-hidden="true">
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
          <span className="confetti-particle" />
        </div>

        <span className="success-check" aria-hidden="true">✓</span>
        {result.revealPosition ? (
          <>
            <p className="success-kicker">Placement Confirmed</p>
            <h3>You are #{result.position.toLocaleString()} in line for {targetLanguage}.</h3>
            <p>Placement matches open in sign-up order. Share your link to jump ahead by 10 spots for each friend who signs up.</p>
          </>
        ) : (
          <>
            <p className="success-kicker">Entry Recorded</p>
            <h3>Your spot is reserved.</h3>
            <p>We will email your first match invitation directly when the {targetLanguage} queue opens.</p>
          </>
        )}
        <div className="share-actions">
          <button type="button" onClick={copyInvite}>Copy invite link</button>
          <button type="button" className="share-primary" onClick={shareInvite}>
            Share link <ArrowIcon />
          </button>
        </div>
        <span className="share-destinations">Your invite link gives priority entry to your study partners.</span>
        {result.previewMode ? (
          <small className="preview-note">Local preview mode active until database environment is configured.</small>
        ) : null}
      </div>
    );
  }

  if (step === "qualifier") {
    return (
      <div className={`qualifier-card ${compact ? "compact" : ""}`}>
        <div className="qualifier-header">
          <span className="qualifier-step">Step 2 of 2</span>
          <h3>Customize your placement cohort</h3>
          <p>Help us tailor your initial ranked match prompts for {email}.</p>
        </div>

        <form onSubmit={submitWaitlistData} className="qualifier-form">
          <div className="qualifier-group">
            <label htmlFor="target-lang-select">What language are you focusing on?</label>
            <select
              id="target-lang-select"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="qualifier-group">
            <label htmlFor="method-select">How do you currently practice?</label>
            <select
              id="method-select"
              value={currentMethod}
              onChange={(e) => setCurrentMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="qualifier-group">
            <label htmlFor="frustration-select">What has been missing from other tools?</label>
            <select
              id="frustration-select"
              value={previousFrustration}
              onChange={(e) => setPreviousFrustration(e.target.value)}
            >
              {FRUSTRATIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {status === "error" ? <p className="form-message error">{error}</p> : null}

          <div className="qualifier-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setStep("email")}
              disabled={status === "submitting"}
            >
              Back
            </button>
            <button type="submit" className="button-primary" disabled={status === "submitting"}>
              <span>{status === "submitting" ? "Securing rank..." : "Claim your rank"}</span>
              <ArrowIcon />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <form className={`waitlist-form ${compact ? "compact" : ""}`} onSubmit={handleInitialEmailSubmit} noValidate>
        <div className="form-row">
          <label className="sr-only" htmlFor={compact ? "final-email" : "hero-email"}>
            Email address
          </label>
          <input
            ref={inputRef}
            id={compact ? "final-email" : "hero-email"}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-invalid={status === "error"}
            aria-describedby={`${compact ? "final" : "hero"}-form-message`}
            disabled={status === "submitting"}
          />
          <button type="submit" disabled={status === "submitting"}>
            <span>Claim your rank</span>
            <ArrowIcon />
          </button>
        </div>

        {status === "error" ? (
          <p id={`${compact ? "final" : "hero"}-form-message`} className="form-message error" aria-live="polite">
            {error}
          </p>
        ) : null}

        <p className="privacy-assurance">
          Join waitlist for priority access, exclusive features &amp; updates. | <Link href="/privacy">Privacy Policy</Link>
        </p>
      </form>
    </div>
  );
}
