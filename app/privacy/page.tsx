import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TheLingo",
  description: "Learn how TheLingo protects your email address, placement queue data, and account information.",
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <div className="policy-container">
        <span className="section-kicker mono">LEGAL &amp; PRIVACY</span>
        <h1>Privacy Assurance &amp; Data Handling</h1>
        <p className="policy-lead">
          We collect minimal information to manage your placement match queue and notify you when your language cohort opens.
        </p>

        <section className="policy-section">
          <h2>1. Information We Collect</h2>
          <p>
            When you join the placement waitlist, we store your email address, language preference, current learning method, and optional referral code. We use this data exclusively to manage queue order and deliver your placement match invitation.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. How We Use Your Data</h2>
          <p>
            Your email is used to notify you when your placement queue opens. We do not sell, rent, or trade your personal contact details to third parties.
          </p>
        </section>

        <section className="policy-section">
          <h2>3. Security &amp; Storage</h2>
          <p>
            Waitlist entries are securely encrypted and stored using standard infrastructure protocols. You can request deletion of your waitlist record at any time by contacting support.
          </p>
        </section>

        <section className="policy-section">
          <h2>4. Contact Information</h2>
          <p>
            Questions regarding data privacy can be directed to lingot228@gmail.com.
          </p>
        </section>
      </div>
    </main>
  );
}
