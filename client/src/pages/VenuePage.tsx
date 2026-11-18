import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Heart, MapPin, Music2, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SiteChrome, RouteIntro } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { venue } from "@/lib/demo-data";
import { sessionKeys, writeIdSession } from "@/lib/session";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function VenuePage() {
  const [, navigate] = useLocation();
  const [saved, setSaved] = useState(false);

  const addToEvent = () => {
    writeIdSession(sessionKeys.venue, venue.id);
    navigate("/event/birthday-25");
  };

  return (
    <SiteChrome>
      <section className="detail-page section-pad">
        <Link className="back-link" href="/">
          <ArrowLeft size={15} /> Back to discovery
        </Link>
        <div className="detail-hero">
          <div className="detail-image">
            <img src={venue.image} alt="Amber Courtyard rooftop venue" />
            <span className="image-badge">
              <span className="status-dot available" /> Available on 22 Nov
            </span>
          </div>
          <div className="detail-copy">
            <RouteIntro
              eyebrow="Venue · C-Scheme, Jaipur"
              title="Amber Courtyard"
              accent="room for a good evening."
              description={venue.description}
            />
            <div className="detail-actions">
              <Button className="primary-button" onClick={addToEvent}>
                <CalendarDays size={16} /> Add to my event
              </Button>
              <button
                className="outline-button"
                type="button"
                aria-label={saved ? "Remove Amber Courtyard from saved" : "Save Amber Courtyard"}
                aria-pressed={saved}
                onClick={() => setSaved(!saved)}
              >
                <Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
              </button>
            </div>
            <div className="detail-stats">
              <span>
                <Users size={15} /> Up to {venue.capacity} guests
              </span>
              <span>
                <Clock3 size={15} /> {venue.priceBasis}
              </span>
              <span>
                <Music2 size={15} /> Acoustic-friendly
              </span>
            </div>
          </div>
        </div>
        <div className="detail-grid">
          <article className="paper-card detail-card">
            <span className="section-kicker">What you can plan with</span>
            <h2>
              The useful details,
              <br />
              <em>before the mood.</em>
            </h2>
            <ul className="fact-list">
              <li>
                <Check size={15} /> Low stage with in-house sound
              </li>
              <li>
                <Check size={15} /> Setup access from 15:30
              </li>
              <li>
                <Check size={15} /> Rooftop café service and parking
              </li>
              <li>
                <Check size={15} /> 4-hour minimum booking
              </li>
            </ul>
          </article>
          <aside className="paper-card detail-card">
            <span className="section-kicker">From {formatINR(venue.price)}</span>
            <h3>Request a quote</h3>
            <p>Prices are reference-only until the venue confirms your date, guest count and setup needs.</p>
            <Button className="primary-button full-width" onClick={addToEvent}>
              Plan around this room <ArrowRight size={15} />
            </Button>
            <div className="detail-note">
              <MapPin size={14} /> C-Scheme, Jaipur · India
            </div>
          </aside>
        </div>
      </section>
    </SiteChrome>
  );
}
