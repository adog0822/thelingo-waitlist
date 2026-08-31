"use client";

import { useState } from "react";

export function BlindJudgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="judge-vector-icon">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" />
      <path d="M7 10C7 10 9 7.5 12 7.5C15 7.5 17 10 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="12.5" x2="18" y2="12.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function RankedMatchCards() {
  const [activeTab, setActiveTab] = useState<"duel" | "verdict">("duel");

  return (
    <div className="ranked-preview-wrapper" aria-label="Ranked match concept preview">
      <div className="preview-top-bar">
        <span className="concept-tag">CONCEPT PREVIEW</span>
        <div className="tab-pills" role="tablist" aria-label="Match view toggle">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "duel"}
            onClick={() => setActiveTab("duel")}
            className={activeTab === "duel" ? "active" : ""}
          >
            1. The Duel
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "verdict"}
            onClick={() => setActiveTab("verdict")}
            className={activeTab === "verdict" ? "active" : ""}
          >
            2. The Verdict
          </button>
        </div>
      </div>

      <div className="split-cards-container">
        {/* Card 1: Prompt & Answers */}
        <article className={`match-card card-duel ${activeTab === "duel" ? "visible" : "hidden-mobile"}`}>
          <div className="card-header">
            <span className="match-id">SPANISH MATCH 0483</span>
            <span className="timer pulse-live">00:18</span>
          </div>

          <div className="prompt-box">
            <span className="constraint-label">CONSTRAINT: PAST PERFECT</span>
            <p className="prompt-text">Your friend arrived 20 minutes late. Roast them using the past tense.</p>
          </div>

          <div className="answers-stack">
            <div className="answer-row winner-preview">
              <div className="player-tag">
                <span className="avatar avatar-blue">A</span>
                <span>Player A</span>
              </div>
              <p className="answer-text">
                Llegaste tan tarde que la fiesta ya <strong>había aprendido</strong> otro idioma.
              </p>
            </div>

            <div className="versus-divider">VS</div>

            <div className="answer-row">
              <div className="player-tag">
                <span className="avatar avatar-coral">B</span>
                <span>Player B</span>
              </div>
              <p className="answer-text">
                Llegaste tarde. La fiesta terminó antes.
              </p>
            </div>
          </div>
        </article>

        {/* Card 2: Blind Verdict & FS Rating Jump */}
        <article className={`match-card card-verdict ${activeTab === "verdict" ? "visible" : "hidden-mobile"}`}>
          <div className="card-header">
            <div className="judge-tag">
              <BlindJudgeIcon />
              <span>Blind AI Judge</span>
            </div>
            <span className="judge-time">1.2s evaluation</span>
          </div>

          <div className="verdict-highlight">
            <span className="winner-pill">PLAYER A WINS</span>
            <p className="reason-text">
              Used the required past perfect tense naturally and landed a sharper punchline.
            </p>
          </div>

          <div className="elo-result-box">
            <div className="rating-movement">
              <span className="fs-change">+184 FS</span>
              <span className="new-rank">Promoted to <strong>Silver II</strong></span>
            </div>
            <span className="world-position">World #1,428</span>
          </div>
        </article>
      </div>
    </div>
  );
}

