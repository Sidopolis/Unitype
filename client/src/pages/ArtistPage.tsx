import { ArrowLeft, ArrowRight, Check, Headphones, MapPin, Mic2, Pause, Play, ShieldCheck, Star, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SiteChrome, RouteIntro } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { artists } from "@/lib/demo-data";
import { sessionKeys, writeIdSession } from "@/lib/session";

export default function ArtistPage() {
  const [location, navigate] = useLocation();
  const artistId = location.split("/").filter(Boolean).pop();
  const artist = artists.find((item) => item.id === artistId);
  const [playing, setPlaying] = useState(false);

  if (!artist) {
    return (
      <SiteChrome>
        <section className="detail-page section-pad">
          <Link className="back-link" href="/">
            <ArrowLeft size={15} /> Back to discovery
          </Link>
          <div className="route-content narrow-route">
            <RouteIntro
              eyebrow="Artist not found"
              title="This profile"
              accent="isn’t in the demo catalogue."
              description="The demo marketplace currently lists Aarav Mehta, The Pink Room and Saffron Sessions."
            />
            <Button className="primary-button" onClick={() => navigate("/")}>
              Return to discovery <ArrowRight size={15} />
            </Button>
          </div>
        </section>
      </SiteChrome>
    );
  }

  const addToEvent = () => {
    writeIdSession(sessionKeys.artist, artist.id);
    navigate("/event/birthday-25");
  };

  return (
    <SiteChrome>
      <section className="detail-page section-pad">
        <Link className="back-link" href="/">
          <ArrowLeft size={15} /> Back to discovery
        </Link>
        <div className="detail-hero artist-detail">
          <div className="detail-image">
            <img src={artist.image} alt={`${artist.name} performing`} />
            <button
              className={`preview-button ${playing ? "playing" : ""}`}
              type="button"
              aria-label={`${playing ? "Pause" : "Play"} demo preview by ${artist.name}`}
              onClick={() => setPlaying(!playing)}
            >
              <span className="preview-icon">
                {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </span>
              {playing ? "Playing demo" : "Play demo preview"}
            </button>
          </div>
          <div className="detail-copy">
            <RouteIntro
              eyebrow={`Artist · ${artist.genre} · ${artist.city}`}
              title={artist.name}
              accent="the room gets warmer."
              description={artist.description}
            />
            <div className="detail-actions">
              <Button className="primary-button" onClick={addToEvent}>
                <Mic2 size={16} /> Add to my event
              </Button>
              <button className="outline-button" type="button" onClick={() => setPlaying(true)}>
                <Headphones size={16} /> Request a preview
              </button>
            </div>
            <div className="detail-stats">
              <span>
                <Star size={15} /> {artist.rating} rating
              </span>
              <span>
                <Users size={15} /> {artist.priceBasis}
              </span>
              <span>
                <MapPin size={15} /> {artist.city}
              </span>
            </div>
          </div>
        </div>
        <div className="detail-grid">
          <article className="paper-card detail-card">
            <span className="section-kicker">Good to know</span>
            <h2>
              A clear brief makes
              <br />
              <em>a better set.</em>
            </h2>
            <ul className="fact-list">
              {artist.needs.map((need) => (
                <li key={need}>
                  <Check size={15} /> {need}
                </li>
              ))}
            </ul>
          </article>
          <aside className="paper-card detail-card">
            <span className="section-kicker">From ₹{artist.price.toLocaleString("en-IN")}</span>
            <h3>Check this artist</h3>
            <p>Availability and final terms are confirmed after you send the event brief.</p>
            <Button className="primary-button full-width" onClick={addToEvent}>
              Build the evening <ArrowRight size={15} />
            </Button>
            <div className="detail-note">
              <ShieldCheck size={14} /> {artist.availability} on your demo date · 22 Nov
            </div>
          </aside>
        </div>
      </section>
    </SiteChrome>
  );
}
