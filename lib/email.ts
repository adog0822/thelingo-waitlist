import { Resend } from "resend";
import { getNextTier, getTier } from "./tiers";
import { getPhrasePack } from "./phrase-pack";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://thelingo.xyz";
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function emailShell(inner: string) {
  return `
    <div style="font-family: 'Avenir Next', 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #101114;">
      ${inner}
      <p style="color: #9b9d98; font-size: 11px; margin-top: 32px;">TheLingo &middot; ${getAppUrl().replace(/^https?:\/\//, "")}</p>
    </div>
  `;
}

function tierBadgeHtml(position: number) {
  const tier = getTier(position);
  const next = getNextTier(position);
  const nextLine = next
    ? `<span style="color:#565853;">Refer ${Math.max(1, Math.ceil((position - next.threshold) / 10))} more ${Math.max(1, Math.ceil((position - next.threshold) / 10)) === 1 ? "friend" : "friends"} to break into <strong>${next.name} ${next.emoji}</strong>.</span>`
    : `<span style="color:#565853;">You're already in the top tier &mdash; nowhere to go but first.</span>`;

  return `
    <div style="border: 2px solid #101114; border-radius: 16px; padding: 18px 20px; margin: 20px 0; background: #f6f6f2;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; color: #ff5f49; text-transform: uppercase;">Founding Member Badge</div>
      <div style="font-size: 26px; font-weight: 900; margin: 6px 0;">${tier.emoji} ${tier.name} &mdash; Rank #${position.toLocaleString()}</div>
      <div style="font-size: 13px;">${nextLine}</div>
    </div>
  `;
}

export async function sendConfirmationEmail(params: {
  email: string;
  targetLanguage?: string;
  referralCode: string;
  position: number;
}) {
  const resend = getResend();
  if (!resend) return;

  const lang = params.targetLanguage || "Spanish";
  const referralUrl = `${getAppUrl()}/?ref=${params.referralCode}`;
  const pack = getPhrasePack(params.targetLanguage);

  const phrasesHtml = pack.phrases
    .map(
      ([phrase, translation]) =>
        `<li style="margin-bottom: 6px;"><strong>${phrase}</strong> <span style="color:#9b9d98;">&mdash; ${translation}</span></li>`,
    )
    .join("");

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "TheLingo Placement <onboarding@resend.dev>",
      to: [params.email],
      replyTo: process.env.RESEND_REPLY_TO || "lingot228@gmail.com",
      subject: `Your ${lang} Placement Spot is Reserved | TheLingo`,
      html: emailShell(`
        <h2 style="font-size: 24px; font-weight: 900;">Your ${lang} placement spot is reserved.</h2>
        <p>We will deliver your initial placement match invitation directly when your language cohort opens.</p>

        ${tierBadgeHtml(params.position)}

        <p style="font-weight: 800; margin-bottom: 6px;">A head start, on the house:</p>
        <ul style="padding-left: 18px; margin-top: 0;">${phrasesHtml}</ul>
        <p style="color:#565853; font-size: 13px;">Drop into a micro-society and open with: <em>"${pack.icebreaker}"</em></p>

        <p style="margin-top: 20px;">Your referral link: <strong>${referralUrl}</strong></p>
        <p style="color: #666; font-size: 13px;">Share it with study partners &mdash; every signup jumps you 10 spots, and we'll email you the moment it happens.</p>
      `),
    });
  } catch (err) {
    console.error("Resend confirmation email failed:", err);
  }
}

export async function sendReferralJumpEmail(params: {
  email: string;
  targetLanguage?: string;
  previousPosition: number;
  newPosition: number;
}) {
  const resend = getResend();
  if (!resend) return;
  if (params.newPosition >= params.previousPosition) return;

  const previousTier = getTier(params.previousPosition);
  const newTier = getTier(params.newPosition);
  const leveledUp = newTier.name !== previousTier.name;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "TheLingo Placement <onboarding@resend.dev>",
      to: [params.email],
      replyTo: process.env.RESEND_REPLY_TO || "lingot228@gmail.com",
      subject: leveledUp
        ? `You leveled up to ${newTier.name}! ${newTier.emoji}`
        : "You just jumped 10 spots on TheLingo",
      html: emailShell(`
        <h2 style="font-size: 24px; font-weight: 900;">Someone just joined using your link.</h2>
        <p>You jumped from <strong>#${params.previousPosition.toLocaleString()}</strong> to <strong>#${params.newPosition.toLocaleString()}</strong>.</p>
        ${
          leveledUp
            ? `<p style="font-size: 18px; font-weight: 800;">${previousTier.emoji} ${previousTier.name} &rarr; ${newTier.emoji} ${newTier.name}</p>`
            : ""
        }
        ${tierBadgeHtml(params.newPosition)}
        <p style="color: #565853; font-size: 13px;">Keep sharing your link &mdash; every new signup moves you another 10 spots closer to the front of the line.</p>
      `),
    });
  } catch (err) {
    console.error("Resend referral-jump email failed:", err);
  }
}
