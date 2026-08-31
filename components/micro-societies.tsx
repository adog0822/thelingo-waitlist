"use client";

import { useState } from "react";

export function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6.5 6H20" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

const multiLangCommunities = [
  {
    flag: "🇪🇸",
    name: "tapas-y-charlas",
    members: "12.4k",
    post: "Debate: Is authentic tortilla de patatas made with or without onion?",
    tag: "Spanish Food & Debate",
  },
  {
    flag: "🇫🇷",
    name: "cinema-nouvelle-vague",
    members: "8.7k",
    post: "Analyze French film dialogue without opening subtitle menus.",
    tag: "French Cinema",
  },
  {
    flag: "🇯🇵",
    name: "konbini-after-midnight",
    members: "18.4k",
    post: "Order, customize, and pay at Tokyo convenience stores entirely in Japanese.",
    tag: "Japanese Culture",
  },
  {
    flag: "🇧🇷",
    name: "bossa-e-afrobeat",
    members: "9.2k",
    post: "Deconstruct MPB song lyrics and discuss Rio vinyl culture in Portuguese.",
    tag: "Brazilian Music",
  },
  {
    flag: "🇮🇹",
    name: "espresso-e-calcio",
    members: "7.9k",
    post: "Debate Serie A tactics over espresso using authentic Italian sports slang.",
    tag: "Italian Culture",
  },
];

const ranks = [
  ["01", "🇪🇸", "solamente", "8,942"],
  ["02", "🇮🇳", "bollywoodb2", "8,771"],
  ["03", "🇺🇸", "verbivore", "8,695"],
  ["1,428", "🇺🇸", "you", "2,184"],
];

type CardKey = "mastery" | "societies" | "ladder";

const QA_CONTENT: Record<CardKey, { title: string; questions: { q: string; a: React.ReactNode }[] }> = {
  mastery: {
    title: "Mastery Lab & Avatar Teaching Mechanics",
    questions: [
      {
        q: "How do users learn the language before they teach an avatar?",
        a: (
          <div className="qa-breakdown">
            <p>
              Users select an avatar of their choice at the beginning of the app. The core flow is: <strong>Learn</strong> (2–5 min interactive segment) → <strong>Teach</strong> (explain it to your avatar) → <strong>Avatar attempts</strong> (your score).
            </p>
            <p>
              Concepts contain the rule, a worked example, and the TL;DR presented through short, interactive, non-lecture scenarios:
            </p>
            <ul>
              <li><strong>Short Contextual Hook:</strong> <em>&ldquo;You&apos;re in a Japanese train station. You just realized you lost your wallet. How do you express the regret of leaving it on the bench? Let&apos;s learn 〜てしまった.&rdquo;</em></li>
              <li><strong>Concise Rule:</strong> <em>&ldquo;For な-adjectives: drop な, add だった for plain past. For verbs: add てしまった to the て-form.&rdquo;</em></li>
              <li><strong>Interactive Example:</strong> <em>&ldquo;Try: 静か (quiet) → 静かだった.&rdquo;</em> The user types it and gets immediate correction.</li>
              <li><strong>The &ldquo;Absurd&rdquo; Scenario:</strong> The system says: <em>&ldquo;Okay! Now Satoru (your avatar) doesn&apos;t understand this rule. He keeps saying 静かかった. Can you explain it to him in your own words? He&apos;s listening...&rdquo;</em></li>
            </ul>
            <p>The Learn phase equips you with the rule, but not the specific answer to the test your avatar will take.</p>
          </div>
        ),
      },
      {
        q: "What exactly is the Mastery Lab?",
        a: (
          <p>
            The Mastery Lab is the centralized hub where users study and master specific concepts for their chosen language. Your avatar levels up alongside you, and you earn FS points through concept mastery.
          </p>
        ),
      },
    ],
  },
  societies: {
    title: "Micro-Societies & Cultural Hubs",
    questions: [
      {
        q: "What is a society?",
        a: (
          <p>
            Societies are small, self-made clubs and groups inside TheLingo where people learning the same language interact, learn, and grow together. Members gather around hyper-specific shared interests—for example, rather than generic <em>&ldquo;Japanese learners&rdquo;</em>, communities form around <em>&ldquo;Japanese learners who love Studio Ghibli&rdquo;</em> or <em>&ldquo;Spanish learners who are into making native Spanish food.&rdquo;</em>
          </p>
        ),
      },
      {
        q: "Can anyone join? And is it anonymous?",
        a: (
          <div className="qa-table-wrap">
            <p><strong>Yes to both.</strong></p>
            <table className="qa-details-table">
              <tbody>
                <tr>
                  <td><strong>Membership</strong></td>
                  <td>Anyone can join, but each micro-society sets its own rules, culture, and inside references.</td>
                </tr>
                <tr>
                  <td><strong>Governance</strong></td>
                  <td>Members vote on rules, elect moderators, and shape community direction.</td>
                </tr>
                <tr>
                  <td><strong>Content</strong></td>
                  <td>User-generated: memes, cultural deep-dives, language challenges, and event planning.</td>
                </tr>
                <tr>
                  <td><strong>Interaction</strong></td>
                  <td>Threaded discussions, real-time chat rooms, and upvote/downvote feedback systems.</td>
                </tr>
                <tr>
                  <td><strong>Identity</strong></td>
                  <td>Anonymous usernames with reputation tied to language skill and community contributions (rating displayed).</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },
    ],
  },
  ladder: {
    title: "Global Ladder & Rating System",
    questions: [
      {
        q: "How is FS scored, what's the max FS/rank, and what do we start with?",
        a: (
          <p>
            Your rating starts at <strong>900 FS</strong> and can scale up to <strong>10,000 FS</strong> as you win more matches. Your score adjusts after every match based on your opponent&apos;s rank, exactly like Elo rating in competitive chess.
          </p>
        ),
      },
    ],
  },
};

export function ProductWorldGrid() {
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);

  return (
    <div className="world-grid-wrapper">
      {activeCard ? (
        /* Expandable Split Panel View */
        <div className="expanded-card-panel" role="region" aria-label="Detailed feature breakdown">
          <div className="panel-top-bar">
            <span className="concept-tag title-case-tag">{QA_CONTENT[activeCard].title}</span>
            <button
              type="button"
              className="close-panel-btn"
              onClick={() => setActiveCard(null)}
            >
              Close Breakdown ✕
            </button>
          </div>

          <div className="panel-split-layout">
            <div className="panel-card-column">
              {activeCard === "mastery" && <MasteryCard active />}
              {activeCard === "societies" && <SocietiesCard active />}
              {activeCard === "ladder" && <LadderCard active />}
            </div>

            <div className="panel-qa-column">
              <h3>{QA_CONTENT[activeCard].title}</h3>
              <div className="qa-accordion-list">
                {QA_CONTENT[activeCard].questions.map((item) => (
                  <details className="qa-item" key={item.q} open>
                    <summary className="qa-question">{item.q}</summary>
                    <div className="qa-answer">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard 3-Column Card Grid */
        <div className="world-grid">
          <div
            className="card-click-wrapper"
            onClick={() => setActiveCard("mastery")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveCard("mastery")}
          >
            <MasteryCard />
          </div>

          <div
            className="card-click-wrapper"
            onClick={() => setActiveCard("societies")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveCard("societies")}
          >
            <SocietiesCard />
          </div>

          <div
            className="card-click-wrapper"
            onClick={() => setActiveCard("ladder")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveCard("ladder")}
          >
            <LadderCard />
          </div>
        </div>
      )}
    </div>
  );
}

function MasteryCard({ active = false }: { active?: boolean }) {
  return (
    <article className={`world-card avatar-card ${active ? "active-panel-card" : ""}`}>
      <div className="world-card-head">
        <span className="card-kicker cut-badge">
          <BookIcon />
          <span>Mastery Lab</span>
        </span>
        <span className="mastery-score">1,640 Pts</span>
      </div>
      <div className="avatar-stage">
        <div className="character-face" aria-label="Nova, learning avatar">
          <span className="hair" />
          <span className="face">
            <i />
            <i />
            <b />
          </span>
        </div>
        <div className="avatar-dialogue">
          <small>Nova is listening</small>
          <p>&ldquo;Why does the verb ending change when the action is finished?&rdquo;</p>
        </div>
      </div>
      <div className="teach-box">
        <span className="box-kicker">Your Explanation</span>
        <p>Use the preterite tense when an action has a definitive completion point.</p>
        <div className="teach-result">
          <span>✓ Nova passed the exam</span>
          <b>+42 Mastery</b>
        </div>
      </div>
      <h3>Your avatar learns only what you can explain clearly.</h3>
      <p className="card-copy">
        Teaching a concept in your own words forces true comprehension before you enter high-stakes matches.
      </p>
      {!active && <span className="explore-hint">Click card to explore how it works ↗</span>}
    </article>
  );
}

function SocietiesCard({ active = false }: { active?: boolean }) {
  return (
    <article className={`world-card society-card ${active ? "active-panel-card" : ""}`}>
      <div className="world-card-head">
        <span className="card-kicker cut-badge">
          <GlobeIcon />
          <span>Micro-Societies</span>
        </span>
        <span className="community-count-badge cut-badge-subtle">5 Active Hubs</span>
      </div>
      <div className="society-list">
        {multiLangCommunities.map((comm) => (
          <div className="society-row" key={comm.name}>
            <span className="society-flag">{comm.flag}</span>
            <div>
              <b>/{comm.name}</b>
              <small>{comm.members} members | {comm.tag}</small>
              <p>{comm.post}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="community-scope-note">
        Featured communities shown above. Join existing rooms or start your own squad room upon entry.
      </p>
      <h3>The language gets a world, not a lesson folder.</h3>
      <p className="card-copy">
        Instead of generic vocabulary decks, discuss cinema in Paris, food debates in Madrid, or vinyl culture in Rio.
      </p>
      {!active && <span className="explore-hint">Click card to explore how it works ↗</span>}
    </article>
  );
}

function LadderCard({ active = false }: { active?: boolean }) {
  return (
    <article className={`world-card ladder-card ${active ? "active-panel-card" : ""}`}>
      <div className="world-card-head">
        <span className="card-kicker cut-badge">
          <TrophyIcon />
          <span>Global Ladder</span>
        </span>
        <span className="season cut-badge-subtle">Season 01</span>
      </div>
      <div className="rank-title">
        <span>Silver II</span>
        <b>Top 14%</b>
      </div>
      <div className="leaderboard">
        {ranks.map(([rank, flag, name, fs], index) => (
          <div className={index === ranks.length - 1 ? "you-row" : ""} key={rank}>
            <span>{rank}</span>
            <i>{flag}</i>
            <b>{name}</b>
            <strong>{fs} FS</strong>
          </div>
        ))}
      </div>
      <div className="rating-explanation">
        <p>
          <strong>Two ratings keep your progress transparent:</strong> Match FS tracks live head-to-head performance, while Mastery points measure your avatar teaching record.
        </p>
      </div>
      <h3>Your fluency has a public scoreboard.</h3>
      <p className="card-copy">
        Your match rating updates immediately after every blind verdict, giving you a clean measure of your actual capability.
      </p>
      {!active && <span className="explore-hint">Click card to explore how it works ↗</span>}
    </article>
  );
}
