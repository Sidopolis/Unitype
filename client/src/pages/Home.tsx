import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  CreditCard,
  Headphones,
  Heart,
  House,
  Info,
  Landmark,
  MapPin,
  Menu,
  Mic2,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { artists, heroImages, quote, schedule, venue, type Artist } from "@/lib/demo-data";
import {
  readBriefSession,
  readIdSession,
  sessionKeys,
  writeBriefSession,
  writeIdSession,
  type EventBrief,
} from "@/lib/session";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type Step = "browse" | "event" | "request" | "quote" | "payment" | "confirmed";
type PaymentState = "idle" | "failed" | "cancelled" | "paid";

const steps: { id: Step; label: string }[] = [
  { id: "browse", label: "Discover" },
  { id: "event", label: "Your event" },
  { id: "request", label: "Availability" },
  { id: "quote", label: "Quote" },
  { id: "payment", label: "Deposit" },
  { id: "confirmed", label: "Confirmed" },
];

const routeForStep = (step: Step) => ({
  browse: "/",
  event: "/event/birthday-25",
  request: "/event/birthday-25?stage=availability",
  quote: "/quote/rz-2411",
  payment: "/quote/rz-2411?stage=deposit",
  confirmed: "/confirmation/rz-2411",
}[step]);

const stepForPath = (path: string): Step => {
  if (path.startsWith("/confirmation")) return "confirmed";
  if (path.startsWith("/quote")) return path.includes("stage=deposit") ? "payment" : "quote";
  if (path.startsWith("/event")) return path.includes("stage=availability") ? "request" : "event";
  return "browse";
};

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const activeArtist = artists[0];

export default function Home() {
  const [location, navigate] = useLocation();
  const [step, setStep] = useState<Step>(() => stepForPath(window.location.pathname + window.location.search));
  const [brief, setBrief] = useState<EventBrief>(() => readBriefSession());
  const [selectedVenue, setSelectedVenue] = useState<string | null>(() => readIdSession(sessionKeys.venue));
  const [selectedArtist, setSelectedArtist] = useState<string | null>(() => readIdSession(sessionKeys.artist));
  const [artistFilter, setArtistFilter] = useState("All styles");
  const [budgetFilter, setBudgetFilter] = useState("₹45k");
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"venues" | "artists" | "full">("venues");
  const [savedVenue, setSavedVenue] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [detail, setDetail] = useState<"venue" | "artist" | null>(null);
  const [mobileEventOpen, setMobileEventOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventPlanId, setEventPlanId] = useState<string | null>(() => readIdSession(sessionKeys.eventPlan));
  const [quoteId, setQuoteId] = useState<string | null>(() => readIdSession(sessionKeys.quote));
  const [requestState, setRequestState] = useState<"draft" | "submitted" | "pending" | "available">("draft");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [toast, setToast] = useState<string | null>(null);

  const createDraftMutation = trpc.marketplace.createDraft.useMutation();
  const requestAvailabilityMutation = trpc.marketplace.requestAvailability.useMutation();
  const createQuoteMutation = trpc.marketplace.createQuote.useMutation();
  const sandboxPaymentMutation = trpc.marketplace.recordSandboxPayment.useMutation();

  const selectedArtistData = artists.find((artist) => artist.id === selectedArtist) ?? null;
  const budgetNumber = Number(budgetFilter.replace(/[^0-9]/g, "")) * (budgetFilter.includes("k") ? 1000 : 1);
  const artistResults = useMemo(() => {
    return artists.filter((artist) => {
      const styleMatches = artistFilter === "All styles" || artist.genre.includes(artistFilter.replace(" styles", ""));
      const queryMatches = `${artist.name} ${artist.role} ${artist.genre}`.toLowerCase().includes(query.toLowerCase());
      const budgetMatches = artist.price <= Math.max(budgetNumber, 12500);
      return styleMatches && queryMatches && budgetMatches;
    });
  }, [artistFilter, budgetNumber, query]);

  useEffect(() => {
    if (requestState === "submitted") {
      const pendingTimer = window.setTimeout(() => setRequestState("pending"), 700);
      return () => {
        window.clearTimeout(pendingTimer);
      };
    }
    if (requestState === "pending") {
      const availableTimer = window.setTimeout(() => setRequestState("available"), 800);
      return () => window.clearTimeout(availableTimer);
    }
  }, [requestState]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const routeWithSearch = location.includes("?") ? location : `${location}${window.location.search}`;
    const routedStep = stepForPath(routeWithSearch);
    if (routedStep !== step) setStep(routedStep);
  }, [location, step]);

  useEffect(() => {
    writeBriefSession(brief);
    writeIdSession(sessionKeys.venue, selectedVenue);
    writeIdSession(sessionKeys.artist, selectedArtist);
    writeIdSession(sessionKeys.eventPlan, eventPlanId);
    writeIdSession(sessionKeys.quote, quoteId);
  }, [brief, selectedVenue, selectedArtist, eventPlanId, quoteId]);

  const currentStepIndex = steps.findIndex((item) => item.id === step);
  const eventReady = Boolean(selectedVenue && selectedArtist);
  const totalBeforeTax = quote.venueFee + quote.artistFee + quote.productionFee + quote.platformFee;
  const quoteTotal = totalBeforeTax + quote.taxes;

  const ensureDraft = async () => {
    if (eventPlanId) return eventPlanId;
    const venueId = selectedVenue ?? venue.id;
    const artistId = selectedArtist ?? activeArtist.id;
    const result = await createDraftMutation.mutateAsync({
      occasion: brief.occasion,
      city: brief.city,
      eventDate: brief.date,
      guestCount: brief.guests,
      budgetPaise: brief.budget * 100,
      style: brief.style,
      selectedVenueId: venueId,
      selectedArtistId: artistId,
    });
    setEventPlanId(result.eventPlanId);
    return result.eventPlanId;
  };

  const ensureQuote = async () => {
    if (quoteId) return quoteId;
    const planId = await ensureDraft();
    const result = await createQuoteMutation.mutateAsync({ eventPlanId: planId });
    setQuoteId(result.quoteId);
    return result.quoteId;
  };

  const selectArtist = (artist: Artist) => {
    if (artist.availability === "Unavailable") {
      setToast(`${artist.name} is already committed on 22 Nov. Try The Pink Room instead.`);
      return;
    }
    setSelectedArtist(artist.id);
    setToast(`${artist.name} added to My Event.`);
  };

  const goTo = (nextStep: Step) => {
    void (async () => {
      try {
        if (nextStep === "quote") await ensureQuote();
        setStep(nextStep);
        navigate(routeForStep(nextStep));
        setMobileEventOpen(false);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        setToast(error instanceof Error ? error.message : "We could not save this event yet. Please try again.");
      }
    })();
  };

  const beginAvailability = () => {
    if (!eventReady) {
      setToast("Choose a venue and artist before requesting availability.");
      goTo("browse");
      return;
    }
    goTo("request");
  };

  const submitRequest = () => {
    void (async () => {
      try {
        const planId = await ensureDraft();
        await requestAvailabilityMutation.mutateAsync({
          eventPlanId: planId,
          venueId: selectedVenue ?? venue.id,
          artistId: selectedArtist ?? activeArtist.id,
        });
        setRequestState("submitted");
        setToast("Request saved. We’re checking both partner calendars.");
      } catch (error) {
        setRequestState("draft");
        setToast(error instanceof Error ? error.message : "We could not send the availability request.");
      }
    })();
  };

  const runPayment = (result: Exclude<PaymentState, "idle">) => {
    void (async () => {
      if (result === "cancelled") {
        setPaymentState(result);
        return;
      }
      try {
        const currentQuoteId = await ensureQuote();
        await sandboxPaymentMutation.mutateAsync({
          quoteId: currentQuoteId,
          outcome: result === "paid" ? "success" : "failure",
        });
        setPaymentState(result);
        if (result === "paid") setToast("Sandbox deposit recorded. Your date is held in the demo.");
        if (result === "failed") setToast("Sandbox payment failed. Nothing was charged — retry when ready.");
      } catch (error) {
        setPaymentState("failed");
        setToast(error instanceof Error ? error.message : "The sandbox payment could not be recorded.");
      }
    })();
  };

  return (
    <div className="rangrez-app">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Rangrez home">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>rangrez</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#venues">Venues</a>
          <a href="#artists">Artists</a>
          <a href="#events">Open mics</a>
          <a href="#events">Events</a>
          <button className="nav-plain" onClick={() => goTo("event")}>Plan an event</button>
        </nav>
        <div className="header-actions">
          <button className="text-action desktop-only">Join as an artist</button>
          <button className="text-action desktop-only">List your venue</button>
          <button className="account-button" aria-label="Account access">AR</button>
          <button className="mobile-menu" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Menu size={20} /></button>
        </div>
      </header>

      {mobileMenuOpen && <div className="mobile-nav-panel" role="dialog" aria-label="Mobile navigation"><a href="#venues" onClick={() => setMobileMenuOpen(false)}>Venues</a><a href="#artists" onClick={() => setMobileMenuOpen(false)}>Artists</a><a href="#events" onClick={() => setMobileMenuOpen(false)}>Open mics</a><button onClick={() => goTo("event")}>Plan an event <ArrowRight size={15} /></button><div className="mobile-nav-meta"><span>Jaipur · India</span><span>Demo catalogue · sandbox only</span></div></div>}

      <main id="top">
        {step === "browse" && (
          <>
            <section className="hero-shell section-pad">
              <div className="hero-copy">
                <div className="eyebrow"><span className="eyebrow-dot" /> Live moments, thoughtfully booked</div>
                <h1>Make room for<br /><em>a good evening.</em></h1>
                <p className="hero-lede">Discover places with a point of view and performers who know how to hold a room. Start with the feeling, we’ll help with the details.</p>
                <div className="hero-cta-row">
                  <Button className="primary-button" onClick={() => goTo("event")}><Sparkles size={16} /> Plan your event</Button>
                  <button className="quiet-link" onClick={() => document.getElementById("venues")?.scrollIntoView({ behavior: "smooth" })}>Browse the city <ArrowRight size={15} /></button>
                </div>
                <div className="hero-proof"><ShieldCheck size={15} /> Demo marketplace · Jaipur · INR pricing · sandbox payments</div>
              </div>
              <div className="hero-visual">
                <img src={heroImages.hero} alt="Acoustic performance on a warm Jaipur rooftop" onError={(event) => { event.currentTarget.src = venue.image; }} />
                <div className="hero-photo-note"><span>01 / 03</span><span>Rooftop evenings<br />in the Pink City</span></div>
                <div className="hero-ticket"><Ticket size={16} /> 25 guests · acoustic · Jaipur</div>
              </div>
            </section>

            <section className="search-board section-pad" aria-label="Start your search">
              <div className="search-board-heading"><span className="section-kicker">Start with the brief</span><span className="demo-label">DEMO CATALOGUE</span></div>
              <div className="search-tabs" role="tablist" aria-label="Search type">
                <button className={`search-tab ${searchMode === "venues" ? "active" : ""}`} role="tab" aria-selected={searchMode === "venues"} onClick={() => setSearchMode("venues")}><Landmark size={16} /> Venues</button>
                <button className={`search-tab ${searchMode === "artists" ? "active" : ""}`} role="tab" aria-selected={searchMode === "artists"} onClick={() => { setSearchMode("artists"); document.getElementById("artists")?.scrollIntoView({ behavior: "smooth" }); }}><Mic2 size={16} /> Artists</button>
                <button className={`search-tab ${searchMode === "full" ? "active" : ""}`} role="tab" aria-selected={searchMode === "full"} onClick={() => { setSearchMode("full"); goTo("event"); }}><Compass size={16} /> Full event</button>
              </div>
              <div className="search-fields">
                <label><span>Occasion</span><select value={brief.occasion} onChange={(event) => setBrief({ ...brief, occasion: event.target.value })}><option>Birthday</option><option>Anniversary</option><option>Corporate dinner</option><option>House concert</option></select></label>
                <label><span>Where</span><div className="input-with-icon"><MapPin size={16} /><input value={brief.city} onChange={(event) => setBrief({ ...brief, city: event.target.value })} /></div></label>
                <label><span>When</span><div className="input-with-icon"><CalendarDays size={16} /><input value={brief.date} onChange={(event) => setBrief({ ...brief, date: event.target.value })} /></div></label>
                <label><span>Guests</span><div className="input-with-icon"><Users size={16} /><input type="number" min={1} value={brief.guests} onChange={(event) => setBrief({ ...brief, guests: Number(event.target.value) })} /></div></label>
                <Button className="primary-button search-button" onClick={() => document.getElementById("venues")?.scrollIntoView({ behavior: "smooth" })}>Find a fit <ArrowRight size={16} /></Button>
              </div>
              <div className="search-foot"><span><Zap size={14} /> Availability checked against demo partner calendars</span><button onClick={() => goTo("event")}>Or tell us what you’re planning <ArrowRight size={14} /></button></div>
            </section>

            <section className="occasion-strip section-pad">
              <div className="section-intro"><span className="section-kicker">Find your atmosphere</span><h2>What kind of evening<br /><em>are you making?</em></h2></div>
              <div className="occasion-list">
                {[["Birthday", "25 warm seats", <Cake size={20} />], ["Rooftop sundowner", "Golden hour", <Sun size={20} />], ["House concert", "Close listening", <House size={20} />], ["Corporate dinner", "A little less formal", <BriefcaseBusiness size={20} />]].map(([title, subtitle, icon]) => <button className="occasion-card" key={title as string} onClick={() => { setBrief({ ...brief, occasion: title as string }); setToast(`${title} is now the active occasion.`); }}><span className="occasion-symbol" aria-hidden="true">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><ArrowRight size={15} /></button>)}
              </div>
            </section>

            <section className="section-pad listing-section" id="venues">
              <div className="section-heading-row"><div><span className="section-kicker">Spaces with a point of view</span><h2>Book the room<br /><em>before the moment.</em></h2></div><button className="quiet-link" onClick={() => setToast("The demo catalogue currently has one fully detailed Jaipur venue.")}>See all venues <ArrowRight size={15} /></button></div>
              <div className="listing-layout">
                <div className="listing-main">
                  <div className="filter-row"><div className="filter-search"><Compass size={16} /><input aria-label="Search venues" placeholder="Search Jaipur venues" onChange={(event) => setQuery(event.target.value)} /></div><button className="filter-chip">Date · 22 Nov <ChevronDown size={14} /></button><button className="filter-chip">Capacity · 25 <ChevronDown size={14} /></button><button className="filter-chip">Indoor / outdoor <ChevronDown size={14} /></button></div>
                  <article className={`venue-feature-card ${selectedVenue ? "is-selected" : ""}`}>
                    <div className="feature-image"><img src={venue.image} alt={`${venue.name} rooftop venue`} /><span className="image-badge"><span className="status-dot available" />{venue.availability} on your date</span><button className={`save-button ${savedVenue ? "saved" : ""}`} aria-label={`${savedVenue ? "Remove" : "Save"} Amber Courtyard`} aria-pressed={savedVenue} onClick={() => { setSavedVenue(!savedVenue); setToast(savedVenue ? "Amber Courtyard removed from saved places." : "Amber Courtyard saved for later."); }}><Heart size={17} fill={savedVenue ? "currentColor" : "none"} /></button></div>
                    <div className="feature-content"><div className="card-topline"><span>{venue.type}</span><span><span className="star">★</span> {venue.rating} ({venue.reviews})</span></div><h3>{venue.name}</h3><p className="muted-line"><MapPin size={14} /> {venue.area} <span>·</span> up to {venue.capacity} guests</p><p>{venue.description}</p><div className="tag-list">{venue.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="card-bottom"><div><strong>{formatINR(venue.price)}</strong><small>{venue.priceBasis}</small></div><div className="card-actions"><button className="link-button" onClick={() => navigate("/venue/amber-courtyard")}>View details <ArrowRight size={14} /></button><Button className="outline-button" onClick={() => { setSelectedVenue(venue.id); setToast("Amber Courtyard added to My Event."); }}> {selectedVenue ? <Check size={15} /> : <Plus size={15} />} {selectedVenue ? "Added" : "Add to event"}</Button></div></div></div>
                  </article>
                </div>
                <aside className="mini-trust"><div className="trust-icon"><ShieldCheck size={18} /></div><strong>Details you can plan with</strong><p>Every partner card shows the facts that affect your evening: capacity, price basis, music rules and setup access.</p><a href="#artists">See artist fits <ArrowRight size={14} /></a></aside>
              </div>
            </section>

            <section className="section-pad artists-section" id="artists">
              <div className="section-heading-row"><div><span className="section-kicker">Artists for your room</span><h2>The right sound<br /><em>changes the room.</em></h2></div><div className="heading-note"><Music2 size={17} /><span>Tap play for a demo preview.<br />Only one preview plays at a time.</span></div></div>
              <div className="artist-toolbar"><div className="artist-filters">{["All styles", "Acoustic", "Indie", "Sufi"].map((filter) => <button className={`filter-chip ${artistFilter === filter ? "active" : ""}`} key={filter} onClick={() => setArtistFilter(filter)} aria-pressed={artistFilter === filter}>{filter}</button>)}</div><select className="budget-select" value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value)} aria-label="Budget filter"><option>₹45k</option><option>₹30k</option><option>₹20k</option></select></div>
              <div className="artist-grid">{artistResults.map((artist) => <ArtistCard key={artist.id} artist={artist} selected={selectedArtist === artist.id} previewing={previewing === artist.id} onPreview={() => setPreviewing(previewing === artist.id ? null : artist.id)} onSelect={() => selectArtist(artist)} onDetails={() => navigate(`/artist/${artist.id}`)} />)}</div>
              {artistResults.length === 0 && <div className="empty-state"><Info size={18} /> No artists match those filters. Try a wider budget.</div>}
            </section>

            <section className="open-mic-banner section-pad" id="events"><div><span className="section-kicker">Coming soon to Rangrez</span><h2>Find your next<br /><em>open mic.</em></h2><p>Audience seats, artist applications and running orders are on the way. For now, build the evening you already have in mind.</p></div><div className="poster-art"><span>OPEN<br />MIC</span><small>Jaipur · December</small></div><button className="outline-button inverse" onClick={() => goTo("event")}>Plan an event <ArrowRight size={15} /></button></section>
          </>
        )}

        {step !== "browse" && <JourneyScreen step={step} brief={brief} setBrief={setBrief} selectedArtistData={selectedArtistData} eventReady={eventReady} requestState={requestState} submitRequest={submitRequest} paymentState={paymentState} runPayment={runPayment} quoteTotal={quoteTotal} goTo={goTo} beginAvailability={beginAvailability} />}
      </main>

      <MyEventRail brief={brief} setBrief={setBrief} selectedVenue={selectedVenue} selectedArtistData={selectedArtistData} step={step} eventReady={eventReady} onOpen={() => setMobileEventOpen(true)} onContinue={() => goTo(eventReady ? "event" : "browse")} />

      {mobileEventOpen && <div className="mobile-drawer-backdrop" onClick={() => setMobileEventOpen(false)}><aside className="mobile-event-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><span className="section-kicker">Your working brief</span><h3>My Event</h3></div><button className="icon-button" onClick={() => setMobileEventOpen(false)} aria-label="Close My Event"><X size={18} /></button></div><EventForm brief={brief} setBrief={setBrief} compact /><div className="drawer-selection"><span className="section-kicker">Selected</span><SelectionLine icon={<Landmark size={15} />} label={selectedVenue ? venue.name : "Add a venue"} filled={Boolean(selectedVenue)} /><SelectionLine icon={<Mic2 size={15} />} label={selectedArtistData ? selectedArtistData.name : "Add an artist"} filled={Boolean(selectedArtistData)} /></div><Button className="primary-button full-width" onClick={() => goTo(eventReady ? "event" : "browse")}>{eventReady ? "Review my event" : "Browse matches"} <ArrowRight size={15} /></Button></aside></div>}

      {detail && <DetailModal type={detail} artist={selectedArtistData ?? activeArtist} onClose={() => setDetail(null)} onSelect={() => { if (detail === "venue") setSelectedVenue(venue.id); else selectArtist(selectedArtistData ?? activeArtist); setDetail(null); }} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /><span>{toast}</span><button onClick={() => setToast(null)} aria-label="Dismiss"><X size={14} /></button></div>}

      <footer className="site-footer"><div><span className="wordmark small"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>rangrez</span></span><p>Good places. Great artists.<br />A little more considered.</p></div><div className="footer-links"><span>Jaipur · India</span><span>Demo catalogue · 2026</span><span>Built for the next good evening.</span></div></footer>
    </div>
  );
}

function ArtistCard({ artist, selected, previewing, onPreview, onSelect, onDetails }: { artist: Artist; selected: boolean; previewing: boolean; onPreview: () => void; onSelect: () => void; onDetails: () => void }) {
  return <article className={`artist-card ${selected ? "is-selected" : ""} ${artist.availability === "Unavailable" ? "is-unavailable" : ""}`}>
    <div className="artist-image-wrap"><img src={artist.image} alt={`${artist.name} performing`} /><span className={`availability-badge ${artist.availability.toLowerCase()}`}><span className="status-dot" />{artist.availability}</span><button className={`preview-button ${previewing ? "playing" : ""}`} onClick={onPreview} aria-label={`${previewing ? "Pause" : "Play"} demo preview by ${artist.name}`}><span className="preview-icon">{previewing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</span>{previewing ? "Playing demo" : "Play preview"}</button></div>
    <div className="artist-card-content"><div className="artist-meta"><span>{artist.genre}</span><span><span className="star">★</span> {artist.rating}</span></div><h3>{artist.name}</h3><p className="artist-role">{artist.role}</p><p className="muted-line"><MapPin size={14} /> {artist.city}</p><div className="artist-tags">{artist.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="artist-card-bottom"><div><strong>{formatINR(artist.price)}</strong><small>{artist.priceBasis}</small></div><div className="card-actions"><button className="link-button" onClick={onDetails}>Profile</button>{artist.availability !== "Unavailable" && <button className="add-icon-button" onClick={onSelect} aria-label={`${selected ? "Remove" : "Add"} ${artist.name}`}>{selected ? <Check size={16} /> : <Plus size={16} />}</button>}</div></div></div>
  </article>;
}

function MyEventRail({ brief, setBrief, selectedVenue, selectedArtistData, step, eventReady, onOpen, onContinue }: { brief: EventBrief; setBrief: (brief: EventBrief) => void; selectedVenue: string | null; selectedArtistData: Artist | null; step: Step; eventReady: boolean; onOpen: () => void; onContinue: () => void }) {
  return <aside className={`my-event-rail ${step !== "browse" ? "journey-rail-hidden" : ""}`}><button className="mobile-rail-trigger" onClick={onOpen}><span><Ticket size={16} /> My Event</span><span className="rail-count">{Number(Boolean(selectedVenue)) + Number(Boolean(selectedArtistData))}/2</span></button><div className="rail-inner"><div className="rail-heading"><div><span className="section-kicker">Your working brief</span><h3>My Event <span className="live-dot" /></h3></div><span className="rail-count">{Number(Boolean(selectedVenue)) + Number(Boolean(selectedArtistData))}/2</span></div><EventForm brief={brief} setBrief={setBrief} /><div className="rail-divider" /><div className="selection-block"><div className="selection-heading"><span>Selected</span><span className="selection-editable">Editable</span></div><SelectionLine icon={<Landmark size={15} />} label={selectedVenue ? venue.name : "Add a venue"} filled={Boolean(selectedVenue)} /><SelectionLine icon={<Mic2 size={15} />} label={selectedArtistData ? selectedArtistData.name : "Add an artist"} filled={Boolean(selectedArtistData)} /></div><div className="compatibility-mini"><div className="compatibility-title"><span className="status-dot available" />{eventReady ? "Good fit so far" : "Two picks make a plan"}</div><p>{eventReady ? "25 guests, acoustic set and a 4-hour rooftop slot line up." : "Choose a venue and artist to see how the evening works together."}</p></div><Button className="primary-button full-width rail-cta" onClick={onContinue}>{step === "browse" ? "Review my event" : "Continue journey"} <ArrowRight size={15} /></Button><p className="rail-note"><ShieldCheck size={13} /> Your brief stays editable as you browse.</p></div></aside>;
}

function EventForm({ brief, setBrief, compact = false }: { brief: EventBrief; setBrief: (brief: EventBrief) => void; compact?: boolean }) {
  return <div className={`event-form ${compact ? "compact" : ""}`}><label><span>Occasion</span><select value={brief.occasion} onChange={(event) => setBrief({ ...brief, occasion: event.target.value })}><option>Birthday</option><option>Anniversary</option><option>Corporate dinner</option><option>House concert</option></select></label><label><span>City</span><input value={brief.city} onChange={(event) => setBrief({ ...brief, city: event.target.value })} /></label><div className="form-grid"><label><span>Date</span><input value={brief.date} onChange={(event) => setBrief({ ...brief, date: event.target.value })} /></label><label><span>Guests</span><input type="number" min={1} value={brief.guests} onChange={(event) => setBrief({ ...brief, guests: Number(event.target.value) })} /></label></div><label><span>Style</span><select value={brief.style} onChange={(event) => setBrief({ ...brief, style: event.target.value })}><option>Acoustic</option><option>Indie-folk</option><option>Sufi</option><option>Open format</option></select></label><label><span>Working budget</span><div className="budget-input"><span>₹</span><input type="number" min={10000} step={1000} value={brief.budget} onChange={(event) => setBrief({ ...brief, budget: Number(event.target.value) })} /></div></label></div>;
}

function SelectionLine({ icon, label, filled }: { icon: React.ReactNode; label: string; filled: boolean }) {
  return <div className={`selection-line ${filled ? "filled" : "empty"}`}><span className="selection-icon">{filled ? <Check size={14} /> : icon}</span><span>{label}</span>{filled && <span className="selection-ok">Ready</span>}</div>;
}

function JourneyScreen({ step, brief, setBrief, selectedArtistData, eventReady, requestState, submitRequest, paymentState, runPayment, quoteTotal, goTo, beginAvailability }: { step: Step; brief: EventBrief; setBrief: (brief: EventBrief) => void; selectedArtistData: Artist | null; eventReady: boolean; requestState: "draft" | "submitted" | "pending" | "available"; submitRequest: () => void; paymentState: PaymentState; runPayment: (state: Exclude<PaymentState, "idle">) => void; quoteTotal: number; goTo: (step: Step) => void; beginAvailability: () => void }) {
  return <section className="journey-shell section-pad"><JourneyHeader step={step} goTo={goTo} />{step === "event" && <EventReview brief={brief} setBrief={setBrief} selectedArtistData={selectedArtistData} eventReady={eventReady} beginAvailability={beginAvailability} />}{step === "request" && <AvailabilityStep requestState={requestState} selectedArtistData={selectedArtistData} goTo={goTo} submitRequest={submitRequest} />}{step === "quote" && <QuoteStep goTo={goTo} quoteTotal={quoteTotal} />}{step === "payment" && <PaymentStep paymentState={paymentState} runPayment={runPayment} quoteTotal={quoteTotal} goTo={goTo} />}{step === "confirmed" && <ConfirmationStep selectedArtistData={selectedArtistData} brief={brief} quoteTotal={quoteTotal} goTo={goTo} />}</section>;
}

function JourneyHeader({ step, goTo }: { step: Step; goTo: (step: Step) => void }) {
  const index = steps.findIndex((item) => item.id === step);
  return <div className="journey-header"><button className="back-link" onClick={() => goTo(index > 0 ? steps[index - 1].id : "browse")}><ArrowLeft size={15} /> Back</button><div className="journey-steps" aria-label="Booking progress">{steps.slice(1).map((item, stepIndex) => <button key={item.id} className={`${stepIndex + 1 < index ? "done" : ""} ${item.id === step ? "current" : ""}`} onClick={() => stepIndex + 1 <= index && goTo(item.id)} disabled={stepIndex + 1 > index}><span>{stepIndex + 1 < index ? <Check size={12} /> : stepIndex + 1}</span>{item.label}</button>)}</div><span className="demo-label">SANDBOX JOURNEY</span></div>;
}

function EventReview({ brief, setBrief, selectedArtistData, eventReady, beginAvailability }: { brief: EventBrief; setBrief: (brief: EventBrief) => void; selectedArtistData: Artist | null; eventReady: boolean; beginAvailability: () => void }) {
  return <div className="journey-content"><div className="journey-intro"><span className="section-kicker">Step 01 · Shape the evening</span><h1>Your event,<br /><em>in a few good lines.</em></h1><p>We’ll carry this brief into every availability request and quote so you can stay focused on the evening itself.</p></div><div className="event-review-grid"><div className="paper-card large"><div className="card-label-row"><span className="demo-label">EVENT BRIEF</span><span className="editable-note"><Sparkles size={13} /> Editable</span></div><div className="big-event-title"><span className="event-symbol" aria-hidden="true"><Cake size={30} /></span><div><span className="section-kicker">{brief.occasion}</span><h2>Aarav’s 30th birthday</h2><p><MapPin size={14} /> {brief.city} · {brief.date} · {brief.time}</p></div></div><div className="review-divider" /><div className="review-fields"><label><span>Occasion name</span><input value="Aarav’s 30th birthday" readOnly /></label><label><span>City</span><input value={brief.city} onChange={(event) => setBrief({ ...brief, city: event.target.value })} /></label><label><span>Date</span><input value={brief.date} onChange={(event) => setBrief({ ...brief, date: event.target.value })} /></label><label><span>Guest count</span><input type="number" value={brief.guests} onChange={(event) => setBrief({ ...brief, guests: Number(event.target.value) })} /></label><label><span>Sound / atmosphere</span><select value={brief.style} onChange={(event) => setBrief({ ...brief, style: event.target.value })}><option>Acoustic</option><option>Indie-folk</option><option>Sufi</option></select></label><label><span>Working budget</span><input type="number" value={brief.budget} onChange={(event) => setBrief({ ...brief, budget: Number(event.target.value) })} /></label></div></div><aside className="paper-card side"><span className="section-kicker">Your picks</span><h3>One room.<br />One good sound.</h3><div className="review-pick"><img src={venue.image} alt="" /><div><small>Venue</small><strong>{venue.name}</strong><span>{venue.area}</span></div><CheckCircle2 size={17} /></div><div className="review-pick"><img src={selectedArtistData?.image ?? activeArtist.image} alt="" /><div><small>Artist</small><strong>{selectedArtistData?.name ?? "Aarav Mehta"}</strong><span>{selectedArtistData?.role ?? activeArtist.role}</span></div><CheckCircle2 size={17} /></div><div className="compatibility-box"><div><ShieldCheck size={16} /><strong>Compatibility summary</strong></div><p>Fits {brief.guests} guests, supports an acoustic set and stays within a {formatINR(brief.budget)} working budget before final terms.</p></div><Button className="primary-button full-width" onClick={beginAvailability}>{eventReady ? "Request availability" : "Choose both picks first"} <ArrowRight size={15} /></Button></aside></div></div>;
}

function AvailabilityStep({ requestState, selectedArtistData, goTo, submitRequest }: { requestState: "draft" | "submitted" | "pending" | "available"; selectedArtistData: Artist | null; goTo: (step: Step) => void; submitRequest: () => void }) {
  const isAvailable = requestState === "available";
  return <div className="journey-content narrow"><div className="journey-intro centered"><span className="section-kicker">Step 02 · Ask the partners</span><h1>Let’s check<br /><em>the calendars.</em></h1><p>Availability is a partner response, not a promise. Rangrez keeps the request, quote and deposit separate so nothing is implied too early.</p></div><div className="status-track"><StatusNode label="Draft" active={requestState === "draft"} done={requestState !== "draft"} /><div className="track-line" /><StatusNode label="Submitted" active={requestState === "submitted"} done={requestState === "pending" || isAvailable} /><div className="track-line" /><StatusNode label="Checking" active={requestState === "pending"} done={isAvailable} /><div className="track-line" /><StatusNode label="Available" active={isAvailable} done={false} /></div><div className="request-card paper-card"><div className="request-card-top"><div className="request-icon"><CalendarDays size={20} /></div><div><span className="demo-label">AVAILABILITY REQUEST · RZ-2411</span><h2>{isAvailable ? "Both partners are available." : requestState === "pending" ? "Checking two calendars…" : "Send one clear request."}</h2></div></div><div className="request-partners"><div><img src={venue.image} alt="" /><div><small>Venue</small><strong>{venue.name}</strong><span>{venue.area} · {venue.capacity} guests</span></div><span className="status-badge available"><span className="status-dot" />{isAvailable ? "Available" : "Awaiting"}</span></div><div><img src={selectedArtistData?.image ?? activeArtist.image} alt="" /><div><small>Artist</small><strong>{selectedArtistData?.name ?? activeArtist.name}</strong><span>{selectedArtistData?.role ?? activeArtist.role}</span></div><span className={`status-badge ${isAvailable ? "available" : "enquire"}`}><span className="status-dot" />{isAvailable ? "Available" : "Awaiting"}</span></div></div><div className="request-note"><Info size={16} /><span>Demo response: venue holds your date until the quote expires. Artist response includes a 30-minute setup buffer and the listed equipment needs.</span></div>{isAvailable ? <Button className="primary-button" onClick={() => goTo("quote")}>Review the quote <ArrowRight size={15} /></Button> : <Button className="primary-button" onClick={submitRequest} disabled={requestState !== "draft"}>{requestState === "draft" ? "Request availability" : "Request sent"} <ArrowRight size={15} /></Button>}</div></div>;
}

function StatusNode({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return <div className={`status-node ${active ? "active" : ""} ${done ? "done" : ""}`}><span>{done ? <Check size={12} /> : ""}</span><small>{label}</small></div>;
}

function QuoteStep({ goTo, quoteTotal }: { goTo: (step: Step) => void; quoteTotal: number }) {
  return <div className="journey-content narrow"><div className="journey-intro centered"><span className="section-kicker">Step 03 · A clear quote</span><h1>Everything in the open,<br /><em>before you pay.</em></h1><p>Reference price, partner terms and the deposit are kept distinct. This quote is illustrative demo data and expires at the time shown below.</p></div><div className="quote-layout"><div className="paper-card quote-card"><div className="quote-topline"><div><span className="demo-label">QUOTE · {quote.reference}</span><h2>Birthday at Amber Courtyard</h2><p><CalendarDays size={14} /> 22 Nov 2026 · 18:30–21:30 · Jaipur</p></div><div className="expiry-badge"><Clock3 size={15} /><span>Valid until<br /><strong>{quote.validUntil}</strong></span></div></div><div className="quote-line-items"><QuoteLine label="Amber Courtyard" note="4 hr rooftop hire · up to 40 guests" value={quote.venueFee} /><QuoteLine label="Aarav Mehta" note="90 min acoustic set · solo + guitar" value={quote.artistFee} /><QuoteLine label="Production add-on" note="DI box, acoustic amp + sound check" value={quote.productionFee} /><QuoteLine label="Rangrez coordination" note="Partner coordination fee" value={quote.platformFee} /><QuoteLine label="Taxes" note="Applicable taxes on this demo quote" value={quote.taxes} /></div><div className="quote-total"><span>Total event estimate</span><strong>{formatINR(quoteTotal)}</strong></div><div className="quote-deposit"><div><span>Due today · sandbox deposit</span><small>50% of pre-tax booking total</small></div><strong>{formatINR(quote.deposit)}</strong></div><div className="quote-terms"><Info size={15} /><span>{quote.terms}</span></div><Button className="primary-button full-width" onClick={() => goTo("payment")}>Accept quote & continue <ArrowRight size={15} /></Button></div><aside className="quote-side"><div className="compatibility-box dark"><div><ShieldCheck size={16} /><strong>Why this works</strong></div><ul><li><Check size={14} /> Fits 25-person capacity</li><li><Check size={14} /> Acoustic-friendly rooftop</li><li><Check size={14} /> Artist travels from Jaipur</li><li><Check size={14} /> Equipment needs covered</li></ul></div><div className="quote-side-note"><ShieldCheck size={15} /><span>Your accepted quote becomes the commercial snapshot for this booking.</span></div></aside></div></div>;
}

function QuoteLine({ label, note, value }: { label: string; note: string; value: number }) { return <div className="quote-line"><div><strong>{label}</strong><span>{note}</span></div><span>{formatINR(value)}</span></div>; }

function PaymentStep({ paymentState, runPayment, quoteTotal, goTo }: { paymentState: PaymentState; runPayment: (state: Exclude<PaymentState, "idle">) => void; quoteTotal: number; goTo: (step: Step) => void }) {
  const hasError = paymentState === "failed";
  return <div className="journey-content narrow"><div className="journey-intro centered"><span className="section-kicker">Step 04 · Sandbox deposit</span><h1>Hold the date,<br /><em>not your breath.</em></h1><p>This is a safe simulation. No real card, UPI or partner account is connected, and no money will move.</p></div><div className="payment-layout"><div className="paper-card payment-card"><div className="sandbox-banner"><CreditCard size={16} /><span><strong>Sandbox payment</strong> · simulated only</span></div><div className="payment-amount"><span>Deposit due today</span><strong>{formatINR(quote.deposit)}</strong><small>for a {formatINR(quoteTotal)} event estimate</small></div><div className="fake-payment-form"><label>Test payment outcome<select defaultValue="success" aria-label="Test payment outcome"><option value="success">Success — approve deposit</option><option value="failure">Failure — decline payment</option></select></label><label>Card number<input value="4242 4242 4242 4242" readOnly /></label><div className="form-grid"><label>Expiry<input value="12 / 28" readOnly /></label><label>CVV<input value="123" readOnly /></label></div></div>{hasError && <div className="payment-error" role="alert"><Info size={16} /><span>Payment failed in sandbox. Your quote is still safe to retry until {quote.validUntil}.</span></div>}{paymentState === "cancelled" && <div className="payment-cancelled"><Info size={16} /> Payment cancelled. Nothing was charged.</div>}<div className="payment-actions"><Button className="primary-button" onClick={() => runPayment("paid")}><ShieldCheck size={15} /> Simulate successful deposit</Button><button className="link-button" onClick={() => runPayment("failed")}>Simulate failure</button><button className="link-button" onClick={() => runPayment("cancelled")}>Cancel</button></div>{paymentState === "paid" && <div className="payment-success"><CheckCircle2 size={17} /> Deposit recorded in sandbox. <button onClick={() => goTo("confirmed")}>View confirmation <ArrowRight size={14} /></button></div>}</div><aside className="payment-side"><div className="payment-summary"><span className="section-kicker">Booking summary</span><strong>Amber Courtyard</strong><span>+ Aarav Mehta</span><span>22 Nov 2026 · Jaipur</span><hr /><div><span>Deposit</span><strong>{formatINR(quote.deposit)}</strong></div><div><span>Remaining balance</span><strong>{formatINR(quoteTotal - quote.deposit)}</strong></div></div><div className="quote-side-note"><ShieldCheck size={15} /><span>Production note: real payment gateway integration is intentionally deferred.</span></div></aside></div></div>;
}

function ConfirmationStep({ selectedArtistData, brief, quoteTotal, goTo }: { selectedArtistData: Artist | null; brief: EventBrief; quoteTotal: number; goTo: (step: Step) => void }) {
  return <div className="journey-content confirmation-content"><div className="confirmation-hero"><div className="success-seal"><Check size={25} /></div><span className="section-kicker">Booking confirmed · sandbox demo</span><h1>A good evening<br /><em>is taking shape.</em></h1><p>Your deposit is recorded and the date is held in this demo. Here’s the plan as it stands.</p><div className="confirmation-ref">RANGREZ · {quote.reference} <span>·</span> 22 NOV 2026</div></div><div className="confirmation-grid"><div className="paper-card confirmation-card"><div className="confirmation-card-head"><div><span className="demo-label">EVENT SCHEDULE</span><h2>Aarav’s 30th birthday</h2><p><CalendarDays size={14} /> {brief.date} · {brief.time} · {brief.city}</p></div><span className="confirmed-pill"><CheckCircle2 size={14} /> Confirmed</span></div><div className="schedule-list">{schedule.map(([time, title, description]) => <div className="schedule-row" key={time}><span>{time}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</div><div className="confirmation-footer-note"><Info size={15} /><span>This schedule is a planning snapshot. Partner contact details become available after real booking in the production product.</span></div></div><aside className="confirmation-side"><div className="confirmation-photo"><img src={heroImages.artist} alt="Artist performing in an intimate cafe" onError={(event) => { event.currentTarget.src = activeArtist.image; }} /><span>A little more considered.</span></div><div className="paper-card confirmed-summary"><span className="section-kicker">Confirmed with</span><div className="confirmed-person"><img src={venue.image} alt="" /><div><strong>{venue.name}</strong><span>{venue.area}</span></div><CheckCircle2 size={16} /></div><div className="confirmed-person"><img src={selectedArtistData?.image ?? activeArtist.image} alt="" /><div><strong>{selectedArtistData?.name ?? activeArtist.name}</strong><span>{selectedArtistData?.role ?? activeArtist.role}</span></div><CheckCircle2 size={16} /></div><div className="confirmed-total"><span>Total estimate</span><strong>{formatINR(quoteTotal)}</strong><small>Deposit paid in sandbox · balance due 48 hrs before event</small></div><Button className="outline-button full-width" onClick={() => goTo("browse")}><RotateCcw size={15} /> Start another plan</Button></div></aside></div></div>;
}

function DetailModal({ type, artist, onClose, onSelect }: { type: "venue" | "artist"; artist: Artist; onClose: () => void; onSelect: () => void }) {
  const isVenue = type === "venue";
  return <div className="modal-backdrop" onClick={onClose}><div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}><button className="icon-button modal-close" onClick={onClose} aria-label="Close details"><X size={18} /></button><div className="detail-modal-image"><img src={isVenue ? venue.image : artist.image} alt="" /></div><div className="detail-modal-body"><span className="section-kicker">{isVenue ? venue.type : artist.genre}</span><h2 id="detail-title">{isVenue ? venue.name : artist.name}</h2><p className="muted-line"><MapPin size={14} /> {isVenue ? `${venue.area} · up to ${venue.capacity} guests` : artist.city}</p><p>{isVenue ? venue.description : artist.description}</p><div className="modal-facts">{(isVenue ? venue.amenities : artist.needs).map((fact) => <span key={fact}><Check size={14} /> {fact}</span>)}</div><div className="modal-bottom"><div><strong>{formatINR(isVenue ? venue.price : artist.price)}</strong><small>{isVenue ? venue.priceBasis : artist.priceBasis}</small></div><Button className="primary-button" onClick={onSelect}>Add to My Event <Plus size={15} /></Button></div></div></div></div>;
}
