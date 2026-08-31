export type Tier = {
  name: string;
  emoji: string;
  threshold: number;
};

const TIERS: Tier[] = [
  { name: "Diamond", emoji: "\u{1F48E}", threshold: 50 },
  { name: "Platinum", emoji: "\u{1F3C6}", threshold: 150 },
  { name: "Gold", emoji: "\u{1F947}", threshold: 500 },
  { name: "Silver", emoji: "\u{1F948}", threshold: 1500 },
  { name: "Bronze", emoji: "\u{1F949}", threshold: Infinity },
];

export function getTier(position: number): Tier {
  return TIERS.find((tier) => position <= tier.threshold) ?? TIERS[TIERS.length - 1];
}

export function getNextTier(position: number): Tier | null {
  const currentIndex = TIERS.findIndex((tier) => position <= tier.threshold);
  if (currentIndex <= 0) return null;
  return TIERS[currentIndex - 1];
}
