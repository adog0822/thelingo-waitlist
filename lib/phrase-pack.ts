type PhrasePack = {
  phrases: [string, string][];
  icebreaker: string;
};

const PHRASE_PACKS: Record<string, PhrasePack> = {
  Spanish: {
    phrases: [
      ["Vale, te sigo.", "Okay, I'm following you."],
      ["Explicamelo de otra forma.", "Explain that to me differently."],
      ["Creo que me equivoque, pero lo intento.", "I think I got that wrong, but I'm trying."],
    ],
    icebreaker: "Que plato de tapas defenderias hasta la muerte?",
  },
  French: {
    phrases: [
      ["D'accord, je te suis.", "Okay, I'm following you."],
      ["Explique-moi autrement.", "Explain that to me a different way."],
      ["Je crois que je me trompe, mais je tente.", "I think I'm wrong, but I'm trying."],
    ],
    icebreaker: "Quel film de la Nouvelle Vague tu defendrais bec et ongles?",
  },
  Japanese: {
    phrases: [
      ["なるほど、ついていけてます。", "Got it, I'm keeping up."],
      ["別の言い方で説明してください。", "Please explain that a different way."],
      ["間違えたかもしれないけど、頃張ってみます。", "I might be wrong, but I'll give it a try."],
    ],
    icebreaker: "一番好きなコンビニスイーツは何ですか？",
  },
  German: {
    phrases: [
      ["Okay, ich komme mit.", "Okay, I'm following along."],
      ["Erklar mir das anders.", "Explain that to me differently."],
      ["Ich glaub, das war falsch, aber ich versuch's.", "I think that was wrong, but I'm trying."],
    ],
    icebreaker: "Welchen Fussballverein verteidigst du bis zum Schluss?",
  },
};

const DEFAULT_PACK: PhrasePack = {
  phrases: [
    ["Okay, I'm following you.", "Say it back in your target language."],
    ["Explain that a different way.", "Say it back in your target language."],
    ["I might be wrong, but I'm trying.", "Say it back in your target language."],
  ],
  icebreaker: "What's one thing about the culture that got you hooked on this language?",
};

export function getPhrasePack(targetLanguage?: string): PhrasePack {
  if (targetLanguage && PHRASE_PACKS[targetLanguage]) return PHRASE_PACKS[targetLanguage];
  return DEFAULT_PACK;
}
