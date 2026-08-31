"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import * as wanakana from "wanakana";
import { BlindJudgeIcon } from "./ranked-cards";

type Language = "English" | "Spanish" | "German" | "French" | "Japanese";

type PromptData = {
  flag: string;
  label: string;
  promptText: string;
  placeholder: string;
  sampleAnswer: string;
};

const PROMPTS: Record<Language, PromptData> = {
  Spanish: {
    flag: "🇪🇸",
    label: "Spanish",
    promptText: "Un mago te concede el poder de volar, pero solo puedes moverte tan rápido como una tortuga caminando. Convence a tu mejor amigo de por qué aún querrías este poder.",
    placeholder: "Escribe tu respuesta en español... (ej. ¡Porque tendría la mejor vista de la ciudad sin tráfico!)",
    sampleAnswer: "¡Porque tendría la mejor vista del atardecer sin tener que lidiar con el tráfico de la ciudad!",
  },
  French: {
    flag: "🇫🇷",
    label: "French",
    promptText: "Un sorcier vous accorde le pouvoir de voler, mais vous ne pouvez vous déplacer qu'à la vitesse d'une tortue qui marche. Convainquez votre meilleur ami de la raison pour laquelle vous voudriez quand même ce pouvoir.",
    placeholder: "Écrivez votre réponse en français...",
    sampleAnswer: "Parce que survoler les toits de Paris en toute sérénité vaut mieux que prendre le métro aux heures de pointe !",
  },
  German: {
    flag: "🇩🇪",
    label: "German",
    promptText: "Ein Zauberer verleiht dir die Fähigkeit zu fliegen, aber du kannst dich nur so schnell bewegen wie eine gehende Schildkröte. Überzeuge deinen besten Freund, warum du diese Kraft trotzdem haben möchtest.",
    placeholder: "Schreibe deine Antwort auf Deutsch...",
    sampleAnswer: "Weil ich schwebend den Ausblick genießen kann, ohne jemals im Stau stehen zu müssen!",
  },
  Japanese: {
    flag: "🇯🇵",
    label: "Japanese",
    promptText: "魔法使いがあなたに空を飛ぶ力を与えてくれますが、歩くウミガメと同じ速さでしか移動できません。なぜそれでもこの力が欲しいのか、親友を説得してください。",
    placeholder: "日本語で入力... (ローマ字入力で自動的にひらがなに変換されます)",
    sampleAnswer: "渋滞を避けて空からの素晴らしい景色を楽しみたいからです！",
  },
  English: {
    flag: "🇺🇸",
    label: "English",
    promptText: "A wizard grants you the power to fly, but you can only move as fast as a walking turtle. Convince your best friend why you'd still want this power.",
    placeholder: "Type your answer in English...",
    sampleAnswer: "Because floating peacefully above traffic with an incredible sunset view is still better than walking!",
  },
};

type ResultData = {
  tier: "Pass" | "Mid" | "Fail";
  displayAccuracy: number;
  fsChange: number;
  newRank: string;
  reason: string;
};

const TIERS = ["Pass", "Mid", "Fail"] as const;

/**
 * `/api/grade-demo` answers with `{ error: string }` on 400/500. That payload has
 * no `tier`, so handing it straight to `setResult` made the render call
 * `result.tier.toLowerCase()` on `undefined`. There is no error boundary around
 * the hero, so React tore down the whole root and the entire landing page went
 * blank. Every response is validated here before it can reach render.
 */
function isResultData(value: unknown): value is ResultData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    TIERS.includes(v.tier as (typeof TIERS)[number]) &&
    typeof v.displayAccuracy === "number" &&
    Number.isFinite(v.displayAccuracy) &&
    typeof v.fsChange === "number" &&
    Number.isFinite(v.fsChange) &&
    typeof v.newRank === "string" &&
    typeof v.reason === "string"
  );
}

const FALLBACK_RESULT: ResultData = {
  tier: "Mid",
  displayAccuracy: 75,
  fsChange: 45,
  newRank: "Maintained Bronze I",
  reason: "Evaluation server busy. Basic conversational structure recognized!",
};

/** Upper bound on how long the UI will sit on "Evaluating..." before falling back. */
const GRADE_TIMEOUT_MS = 12_000;

export function InteractiveJudgeDemo() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("Spanish");
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);

  // 30-Second Live Timer State
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // 3D Cursor Tracking Tilt State (Capped tight at 3.2 degrees)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 3.2;
    const rotateY = (x / (rect.width / 2)) * 3.2;
    setTilt({ x: rotateX, y: rotateY });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const inputRef = useRef<HTMLInputElement>(null);
  // Identifies the match a pending grade belongs to. Bumped by every submit and
  // every reset so a late response cannot land on an abandoned match.
  const submissionRef = useRef(0);

  const activePrompt = PROMPTS[selectedLanguage];
  const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
  const isReady = wordCount >= 3;

  // Live Timer Interval Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive && timeLeft > 0 && !isEvaluating && !result && !isExpired) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft, isEvaluating, result, isExpired]);

  function resetMatchState() {
    // Abandons any in-flight grade so its response is discarded instead of
    // rendering a verdict for the previous answer/language.
    submissionRef.current += 1;
    setUserAnswer("");
    setResult(null);
    setTimeLeft(30);
    setIsTimerActive(false);
    setIsExpired(false);
    setIsEvaluating(false);
  }

  function handleLanguageChange(lang: Language) {
    setSelectedLanguage(lang);
    resetMatchState();
  }

  function startTimerIfNeeded() {
    if (!isTimerActive && !isExpired && !result && timeLeft > 0) {
      setIsTimerActive(true);
    }
  }

  function handleInputChange(val: string) {
    startTimerIfNeeded();
    if (selectedLanguage === "Japanese") {
      const converted = wanakana.toKana(val);
      setUserAnswer(converted);
    } else {
      setUserAnswer(val);
    }
    if (result) setResult(null);
  }

  // NOT named `useSampleAnswer`: React's lint rules and the React Compiler treat
  // any `use*` function as a hook, which makes an ordinary click handler look
  // like a conditionally-called hook.
  function fillSampleAnswer() {
    startTimerIfNeeded();
    setUserAnswer(activePrompt.sampleAnswer);
    if (result) setResult(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userAnswer.trim() || isEvaluating || isExpired) return;

    const submissionId = submissionRef.current + 1;
    submissionRef.current = submissionId;

    setIsTimerActive(false);
    setIsEvaluating(true);
    setResult(null);

    // A hung serverless invocation must not strand the UI on "Evaluating..."
    // forever; abort and show the fallback verdict instead.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GRADE_TIMEOUT_MS);

    try {
      const response = await fetch("/api/grade-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLanguage, answer: userAnswer }),
        signal: controller.signal,
      });

      const payload: unknown = response.ok ? await response.json() : null;

      // Brief suspenseful evaluation beat + drawer reveal anticipation
      await new Promise((res) => setTimeout(res, 1200));
      if (submissionRef.current !== submissionId) return;

      const data = isResultData(payload) ? payload : FALLBACK_RESULT;
      setResult(data);
      if (personalBest === null || data.displayAccuracy > personalBest) {
        setPersonalBest(data.displayAccuracy);
      }
    } catch {
      if (submissionRef.current !== submissionId) return;
      setResult(FALLBACK_RESULT);
    } finally {
      clearTimeout(timeoutId);
      if (submissionRef.current === submissionId) setIsEvaluating(false);
    }
  }

  const formattedTimer = `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`;

  return (
    <div
      className={`interactive-demo-card ${isExpired ? "match-expired" : ""}`}
      aria-label="Interactive language match demo"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top Header & Language Selector */}
      <div className="demo-header">
        <div className="header-title-block">
          <span className="concept-tag zesty-underline cut-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Live Interactive Demo</span>
            <svg className="zesty-stroke" viewBox="0 0 140 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8C35 3 105 2 138 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M12 10C45 6 95 6 128 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </span>
          <span className="demo-subtitle">Select a target language and test your response in real-time</span>
        </div>

        <div className="language-selector-pills" role="tablist" aria-label="Language selection">
          {(Object.keys(PROMPTS) as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={selectedLanguage === lang}
              className={`lang-pill ${selectedLanguage === lang ? "active" : ""}`}
              onClick={() => handleLanguageChange(lang)}
            >
              <span>{PROMPTS[lang].flag}</span>
              <b>{PROMPTS[lang].label}</b>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Card & Input Surface */}
      <div className="demo-body">
        <div className="prompt-display-box">
          <div className="prompt-meta-row">
            <span className="prompt-id">PROMPT #082 {selectedLanguage.toUpperCase()}</span>
            <span className={`timer ${timeLeft <= 5 ? "timer-warning" : "pulse-live"}`}>
              {formattedTimer}
            </span>
          </div>
          <p className="prompt-text-content">&ldquo;{activePrompt.promptText}&rdquo;</p>
        </div>

        <form onSubmit={handleSubmit} className="demo-form">
          <div className={`input-container-shell ${isEvaluating ? "evaluating" : ""} ${isExpired ? "disabled" : ""}`}>
            <input
              ref={inputRef}
              type="text"
              className="interactive-input"
              placeholder={activePrompt.placeholder}
              value={userAnswer}
              onFocus={startTimerIfNeeded}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isEvaluating || isExpired}
            />

            {/* Crawling Turtle Motion Icon */}
            <div className="crawling-turtle-track" aria-hidden="true">
              <span className="turtle-icon">🐢</span>
            </div>

            {/* Live Typing Feedback Counter */}
            <div className="input-feedback-bar">
              <span className="word-count-badge">
                {wordCount} {wordCount === 1 ? "word" : "words"}
                {isReady ? " | Ready to submit" : ""}
                {!isTimerActive && !isExpired && wordCount === 0 ? " | Type to start 30s timer" : ""}
              </span>
              <button
                type="button"
                className="sample-answer-btn"
                onClick={fillSampleAnswer}
                disabled={isEvaluating || isExpired}
              >
                Auto-fill sample answer 🪄
              </button>
            </div>
          </div>

          <div className="submit-action-row">
            <button
              type="submit"
              className={`submit-demo-btn ${isEvaluating ? "loading" : ""}`}
              disabled={!userAnswer.trim() || isEvaluating || isExpired}
            >
              {isEvaluating ? (
                <>
                  <BlindJudgeIcon />
                  <span>Evaluating 1.2s...</span>
                </>
              ) : (
                <>
                  <span>Submit for Verdict</span>
                  <span className="arrow-icon">↗</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* TIME EXPIRED OVERLAY WITH RED X */}
        {isExpired ? (
          <div className="expired-overlay-box" role="alert" aria-live="assertive">
            <div className="expired-red-x-circle" aria-hidden="true">
              <span>✕</span>
            </div>
            <h3>TIME EXPIRED</h3>
            <p>You ran out of time to submit your response before the 30-second match timer hit 00:00!</p>
            <button
              type="button"
              className="expired-retry-btn"
              onClick={() => {
                resetMatchState();
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              Try Again ↺
            </button>
          </div>
        ) : null}

        {/* Verdict & Rating Movement Output */}
        {result && !isExpired ? (
          <div className={`verdict-result-card tier-${result.tier.toLowerCase()}`} role="region" aria-live="polite">
            <div className="verdict-card-head">
              <div className="judge-info">
                <BlindJudgeIcon />
                <span>Blind Judge Verdict</span>
              </div>
              <div className="accuracy-badge">
                <span className="acc-score">{result.displayAccuracy}% ACCURACY</span>
              </div>
            </div>

            <div className="verdict-card-body">
              <span className="tier-badge">{result.tier === "Pass" ? "✓ EXCELLENT PASS" : result.tier === "Mid" ? "⚡ GOOD ATTEMPT" : "✕ NEEDS WORK"}</span>
              <p className="verdict-reason">{result.reason}</p>

              <div className="result-stats-row">
                <div className="stat-item">
                  <span className="stat-label">RATING CHANGE</span>
                  <span className="stat-val fs-val">{result.fsChange > 0 ? `+${result.fsChange}` : result.fsChange} FS</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">LADDER STATUS</span>
                  <span className="stat-val rank-val">{result.newRank}</span>
                </div>
                {personalBest !== null ? (
                  <div className="stat-item pb-item">
                    <span className="stat-label">PERSONAL BEST TODAY</span>
                    <span className="stat-val pb-val">{personalBest}%</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="retry-loop-footer">
              <p className="retry-copy">
                You got <strong>{result.displayAccuracy}%</strong>. Can you push it higher?
              </p>
              <button
                type="button"
                className="retry-btn"
                onClick={() => {
                  resetMatchState();
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              >
                Try Again ↺
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

