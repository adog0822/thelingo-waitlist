import Link from "next/link";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>L</span>
      <i />
    </span>
  );
}

export function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function SiteNav() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TheLingo home">
        <BrandMark />
        TheLingo
      </Link>
      <nav aria-label="Primary navigation">
        <a href="#demo">Interactive Demo</a>
        <a href="#world">Micro-Societies</a>
        <Link href="/privacy">Privacy Policy</Link>
        <a href="mailto:lingot228@gmail.com">Contact</a>
      </nav>
      <a className="header-cta" href="#waitlist">
        Claim your rank <ArrowIcon />
      </a>
    </header>
  );
}
