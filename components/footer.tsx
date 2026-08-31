import Link from "next/link";
import { ContactLink } from "./contact-link";
import { BrandMark } from "./nav";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-col">
          <Link className="brand inverted" href="/" aria-label="TheLingo home">
            <BrandMark />
            TheLingo
          </Link>
          <p className="footer-tagline">Language learning is a sport now.</p>
          <p className="footer-value-prop">
            Ranked matches to see your skills in action, your avatar speedruns your fluency, and a global community keeps you climbing together.
          </p>
        </div>
        <div className="footer-nav-col">
          <span className="footer-head mono">NAVIGATION</span>
          <nav aria-label="Footer navigation">
            <a href="#demo">Interactive Demo</a>
            <a href="#world">Micro-Societies</a>
            <Link href="/privacy">Privacy Policy</Link>
            {/* The header nav is hidden below 860px, so this is the only route
                to Contact on a phone. */}
            <ContactLink />
          </nav>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="mono">© 2026 THELINGO</span>
        <span className="footer-security">Encrypted waitlist &amp; private queue verification</span>
      </div>
    </footer>
  );
}
