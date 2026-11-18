import { ArrowRight, Menu, Ticket, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export function SiteChrome({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  return <div className="rangrez-app route-app">
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Rangrez home"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>rangrez</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#venues">Venues</Link><Link href="/#artists">Artists</Link><Link href="/#events">Open mics</Link><button className="nav-plain" onClick={() => navigate("/event/birthday-25")}>Plan an event</button></nav>
      <div className="header-actions"><button className="text-action desktop-only">Join as an artist</button><button className="text-action desktop-only">List your venue</button><button className="account-button" aria-label="Account access">AR</button><button className="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
    </header>
    {menuOpen && <div className="mobile-nav-panel" role="dialog" aria-label="Mobile navigation"><Link href="/#venues" onClick={() => setMenuOpen(false)}>Venues</Link><Link href="/#artists" onClick={() => setMenuOpen(false)}>Artists</Link><Link href="/#events" onClick={() => setMenuOpen(false)}>Open mics</Link><button onClick={() => { setMenuOpen(false); navigate("/event/birthday-25"); }}>Plan an event <ArrowRight size={15} /></button><div className="mobile-nav-meta"><span>Jaipur · India</span><span>Demo catalogue · sandbox only</span></div></div>}
    <main>{children}</main>
    <footer className="site-footer"><div><Link className="wordmark small" href="/"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>rangrez</span></Link><p>Good places. Great artists.<br />A little more considered.</p></div><div className="footer-links"><span>Jaipur · India</span><span>Demo catalogue · 2026</span><span><Ticket size={12} /> Sandbox journey</span></div></footer>
  </div>;
}

export function RouteIntro({ eyebrow, title, accent, description }: { eyebrow: string; title: string; accent: string; description: string }) {
  return <div className="route-intro"><span className="section-kicker">{eyebrow}</span><h1>{title}<br /><em>{accent}</em></h1><p>{description}</p></div>;
}
