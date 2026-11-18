import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, CreditCard, Info, MapPin, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { SiteChrome, RouteIntro } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { artists, quote, schedule, venue, type Artist } from "@/lib/demo-data";
import {
  readBriefSession,
  readIdSession,
  readJsonSession,
  sessionKeys,
  writeBriefSession,
  writeIdSession,
  writeJsonSession,
  type EventBrief,
} from "@/lib/session";
import { trpc } from "@/lib/trpc";

type Stage = "event" | "availability" | "quote" | "payment" | "confirmation";

const stageOrder: Stage[] = ["event", "availability", "quote", "payment", "confirmation"];
const stageLabels: Record<Stage, string> = {
  event: "Your event",
  availability: "Availability",
  quote: "Quote",
  payment: "Deposit",
  confirmation: "Confirmed",
};

const stageFromLocation = (location: string): Stage =>
  location.startsWith("/confirmation")
    ? "confirmation"
    : location.startsWith("/payment") || location.includes("stage=deposit")
      ? "payment"
      : location.startsWith("/quote")
        ? "quote"
        : location.startsWith("/availability") || location.includes("stage=availability")
          ? "availability"
          : "event";

const pathForStage = (stage: Stage) =>
  stage === "event"
    ? "/event/birthday-25"
    : stage === "availability"
      ? "/availability/birthday-25"
      : stage === "quote"
        ? "/quote/rz-2411"
        : stage === "payment"
          ? "/payment/rz-2411"
          : "/confirmation/rz-2411";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const quoteTotal = quote.venueFee + quote.artistFee + quote.productionFee + quote.platformFee + quote.taxes;

export default function BookingPage() {
  const [location, navigate] = useLocation();
  const stage = stageFromLocation(`${location}${typeof window !== "undefined" ? window.location.search : ""}`);
  const [brief, setBrief] = useState<EventBrief>(() => readBriefSession());
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(() => readIdSession(sessionKeys.venue) ?? venue.id);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(() => readIdSession(sessionKeys.artist) ?? artists[0].id);
  const [requestState, setRequestState] = useState<"draft" | "pending" | "available">(() =>
    readJsonSession(sessionKeys.availabilityDone, false) ? "available" : "draft",
  );
  const [paymentState, setPaymentState] = useState<"idle" | "failed" | "paid">("idle");
  const [eventPlanId, setEventPlanId] = useState<string | null>(() => readIdSession(sessionKeys.eventPlan));
  const [quoteId, setQuoteId] = useState<string | null>(() => readIdSession(sessionKeys.quote));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDraft = trpc.marketplace.createDraft.useMutation();
  const requestAvailability = trpc.marketplace.requestAvailability.useMutation();
  const createQuote = trpc.marketplace.createQuote.useMutation();
  const recordPayment = trpc.marketplace.recordSandboxPayment.useMutation();

  const selectedArtist: Artist = artists.find((item) => item.id === selectedArtistId) ?? artists[0];
  const selectedVenueName = venue.name;

  useEffect(() => {
    writeBriefSession(brief);
  }, [brief]);

  useEffect(() => {
    writeIdSession(sessionKeys.venue, selectedVenueId);
    writeIdSession(sessionKeys.artist, selectedArtistId);
  }, [selectedVenueId, selectedArtistId]);

  useEffect(() => {
    writeIdSession(sessionKeys.eventPlan, eventPlanId);
    writeIdSession(sessionKeys.quote, quoteId);
  }, [eventPlanId, quoteId]);

  useEffect(() => {
    if (stage !== "availability") return;
    const done = readJsonSession(sessionKeys.availabilityDone, false);
    setRequestState(done ? "available" : "draft");
  }, [stage]);

  useEffect(() => {
    if (requestState !== "pending") return;
    const timer = window.setTimeout(() => {
      setRequestState("available");
      writeJsonSession(sessionKeys.availabilityDone, true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [requestState]);

  const ensureDraft = async () => {
    if (eventPlanId) return eventPlanId;
    const result = await createDraft.mutateAsync({
      occasion: brief.occasion,
      city: brief.city,
      eventDate: brief.date,
      guestCount: brief.guests,
      budgetPaise: brief.budget * 100,
      style: brief.style,
      selectedVenueId: selectedVenueId ?? venue.id,
      selectedArtistId: selectedArtistId ?? artists[0].id,
    });
    setEventPlanId(result.eventPlanId);
    return result.eventPlanId;
  };

  const go = (next: Stage) => {
    setError(null);
    navigate(pathForStage(next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (stage === "event") {
      navigate("/");
      return;
    }
    const index = stageOrder.indexOf(stage);
    go(stageOrder[Math.max(0, index - 1)]);
  };

  const submitAvailability = async () => {
    setBusy(true);
    setError(null);
    try {
      const planId = await ensureDraft();
      await requestAvailability.mutateAsync({
        eventPlanId: planId,
        venueId: selectedVenueId ?? venue.id,
        artistId: selectedArtistId ?? artists[0].id,
      });
      setRequestState("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send the availability request.");
      setRequestState("draft");
    } finally {
      setBusy(false);
    }
  };

  const acceptQuote = async () => {
    setBusy(true);
    setError(null);
    try {
      const planId = await ensureDraft();
      const result = await createQuote.mutateAsync({ eventPlanId: planId });
      setQuoteId(result.quoteId);
      go("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not create the quote.");
    } finally {
      setBusy(false);
    }
  };

  const pay = async (outcome: "success" | "failure") => {
    setBusy(true);
    setError(null);
    try {
      let currentQuote = quoteId;
      if (!currentQuote) {
        const planId = await ensureDraft();
        const created = await createQuote.mutateAsync({ eventPlanId: planId });
        currentQuote = created.quoteId;
        setQuoteId(currentQuote);
      }
      await recordPayment.mutateAsync({ quoteId: currentQuote, outcome });
      setPaymentState(outcome === "success" ? "paid" : "failed");
    } catch (err) {
      setPaymentState("failed");
      setError(err instanceof Error ? err.message : "The sandbox payment could not be recorded.");
    } finally {
      setBusy(false);
    }
  };

  const stageIndex = stageOrder.indexOf(stage);

  return (
    <SiteChrome>
      <section className="booking-page section-pad">
        <div className="booking-top">
          <button className="back-link" onClick={goBack}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="booking-progress" aria-label="Booking progress">
            {stageOrder.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`${stage === item ? "current" : ""} ${stageIndex > index ? "done" : ""}`}
                onClick={() => index <= stageIndex && go(item)}
                disabled={index > stageIndex}
              >
                <span>{stageIndex > index ? <Check size={12} /> : index + 1}</span>
                {stageLabels[item]}
              </button>
            ))}
          </div>
          <span className="demo-label">SANDBOX JOURNEY</span>
        </div>

        {error && (
          <div className="payment-error booking-inline-error" role="alert">
            <Info size={15} /> {error}
          </div>
        )}

        {stage === "event" && (
          <EventStage
            brief={brief}
            setBrief={setBrief}
            selectedArtist={selectedArtist}
            venueName={selectedVenueName}
            go={go}
          />
        )}
        {stage === "availability" && (
          <AvailabilityStage
            state={requestState}
            submit={submitAvailability}
            go={go}
            busy={busy}
            selectedArtist={selectedArtist}
          />
        )}
        {stage === "quote" && <QuoteStage accept={acceptQuote} busy={busy} />}
        {stage === "payment" && <PaymentStage state={paymentState} pay={pay} go={go} busy={busy} />}
        {stage === "confirmation" && <ConfirmationStage brief={brief} selectedArtist={selectedArtist} />}
      </section>
    </SiteChrome>
  );
}

function EventStage({
  brief,
  setBrief,
  selectedArtist,
  venueName,
  go,
}: {
  brief: EventBrief;
  setBrief: (brief: EventBrief) => void;
  selectedArtist: Artist;
  venueName: string;
  go: (stage: Stage) => void;
}) {
  return (
    <div className="route-content">
      <RouteIntro
        eyebrow="Step 01 · Your event"
        title="Shape the evening"
        accent="in a few good lines."
        description="One working brief carries your date, guest count and sound into every request and quote."
      />
      <div className="route-two-col">
        <article className="paper-card route-card">
          <div className="route-card-label">
            <span className="demo-label">EVENT BRIEF</span>
            <span className="editable-note">Editable</span>
          </div>
          <h2>Aarav’s 30th birthday</h2>
          <div className="brief-summary">
            <span>
              <MapPin size={15} /> {brief.city}
            </span>
            <span>
              <CalendarDays size={15} /> {brief.date}
            </span>
            <span>
              <Users size={15} /> {brief.guests} guests
            </span>
          </div>
          <div className="route-form-grid">
            <label>
              City
              <input value={brief.city} onChange={(event) => setBrief({ ...brief, city: event.target.value })} />
            </label>
            <label>
              Date
              <input value={brief.date} onChange={(event) => setBrief({ ...brief, date: event.target.value })} />
            </label>
            <label>
              Guests
              <input
                type="number"
                min={1}
                value={brief.guests}
                onChange={(event) => setBrief({ ...brief, guests: Number(event.target.value) || 1 })}
              />
            </label>
            <label>
              Style
              <select value={brief.style} onChange={(event) => setBrief({ ...brief, style: event.target.value })}>
                <option>Acoustic</option>
                <option>Indie-folk</option>
                <option>Sufi</option>
              </select>
            </label>
          </div>
        </article>
        <aside className="paper-card route-card">
          <span className="section-kicker">Your picks</span>
          <h3>
            One room.
            <br />
            One good sound.
          </h3>
          <div className="mini-pick">
            <img src={venue.image} alt={`${venueName} rooftop venue`} />
            <span>
              <strong>{venueName}</strong>
              <small>{venue.area}</small>
            </span>
            <CheckCircle2 size={16} />
          </div>
          <div className="mini-pick">
            <img src={selectedArtist.image} alt={`${selectedArtist.name} performing`} />
            <span>
              <strong>{selectedArtist.name}</strong>
              <small>{selectedArtist.role}</small>
            </span>
            <CheckCircle2 size={16} />
          </div>
          <Button className="primary-button full-width" onClick={() => go("availability")}>
            Request availability <ArrowRight size={15} />
          </Button>
        </aside>
      </div>
    </div>
  );
}

function AvailabilityStage({
  state,
  submit,
  go,
  busy,
  selectedArtist,
}: {
  state: "draft" | "pending" | "available";
  submit: () => void;
  go: (stage: Stage) => void;
  busy: boolean;
  selectedArtist: Artist;
}) {
  const available = state === "available";
  return (
    <div className="route-content narrow-route">
      <RouteIntro
        eyebrow="Step 02 · Ask the partners"
        title="Check the calendars"
        accent={available ? "both are looking good." : "before we promise anything."}
        description="Availability is a partner response. The request, quote and deposit stay separate until each step is confirmed."
      />
      <div className="status-track route-status">
        <Status label="Draft" active={state === "draft"} done={state !== "draft"} />
        <div className="track-line" />
        <Status label="Checking" active={state === "pending"} done={available} />
        <div className="track-line" />
        <Status label="Available" active={available} done={false} />
      </div>
      <article className="paper-card route-card request-route-card">
        <div className="request-card-top">
          <div className="request-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <span className="demo-label">AVAILABILITY REQUEST · RZ-2411</span>
            <h2>
              {available
                ? "Both partners are available."
                : state === "pending"
                  ? "Checking two calendars…"
                  : "Send one clear request."}
            </h2>
          </div>
        </div>
        <div className="mini-pick">
          <img src={venue.image} alt={`${venue.name} rooftop venue`} />
          <span>
            <strong>{venue.name}</strong>
            <small>Available on your date</small>
          </span>
          <span className="status-badge available">{available ? "Available" : "Awaiting"}</span>
        </div>
        <div className="mini-pick">
          <img src={selectedArtist.image} alt={`${selectedArtist.name} performing`} />
          <span>
            <strong>{selectedArtist.name}</strong>
            <small>{selectedArtist.role}</small>
          </span>
          <span className="status-badge available">{available ? "Available" : "Awaiting"}</span>
        </div>
        <div className="request-note">
          <Info size={15} /> Demo response includes setup buffer and listed equipment needs.
        </div>
        {available ? (
          <Button className="primary-button" onClick={() => go("quote")}>
            Review the quote <ArrowRight size={15} />
          </Button>
        ) : (
          <Button className="primary-button" onClick={submit} disabled={busy || state !== "draft"}>
            {state === "pending" || busy ? "Checking…" : "Request availability"} <ArrowRight size={15} />
          </Button>
        )}
      </article>
    </div>
  );
}

function Status({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`status-node ${active ? "active" : ""} ${done ? "done" : ""}`}>
      <span>{done ? <Check size={12} /> : ""}</span>
      <small>{label}</small>
    </div>
  );
}

function QuoteStage({ accept, busy }: { accept: () => void; busy: boolean }) {
  return (
    <div className="route-content narrow-route">
      <RouteIntro
        eyebrow="Step 03 · A clear quote"
        title="Everything in the open"
        accent="before you pay."
        description="Reference price, partner terms and the sandbox deposit are separate and itemized."
      />
      <article className="paper-card route-card quote-route-card">
        <div className="quote-topline">
          <div>
            <span className="demo-label">QUOTE · {quote.reference}</span>
            <h2>Birthday at Amber Courtyard</h2>
            <p>
              <CalendarDays size={14} /> 22 Nov 2026 · 18:30–21:30 · Jaipur
            </p>
          </div>
          <div className="expiry-badge">
            <Clock3 size={15} />
            <span>
              Valid until
              <br />
              <strong>{quote.validUntil}</strong>
            </span>
          </div>
        </div>
        {(
          [
            ["Amber Courtyard", quote.venueFee],
            ["Aarav Mehta", quote.artistFee],
            ["Production add-on", quote.productionFee],
            ["Rangrez coordination", quote.platformFee],
            ["Taxes", quote.taxes],
          ] as const
        ).map(([label, value]) => (
          <div className="quote-line" key={label}>
            <strong>{label}</strong>
            <span>{formatINR(value)}</span>
          </div>
        ))}
        <div className="quote-total">
          <span>Total event estimate</span>
          <strong>{formatINR(quoteTotal)}</strong>
        </div>
        <div className="quote-deposit">
          <span>Due today · sandbox deposit</span>
          <strong>{formatINR(quote.deposit)}</strong>
        </div>
        <p className="quote-terms-inline">
          <Info size={14} /> {quote.terms}
        </p>
        <Button className="primary-button full-width" onClick={accept} disabled={busy}>
          {busy ? "Preparing deposit…" : "Accept quote & continue"} <ArrowRight size={15} />
        </Button>
      </article>
    </div>
  );
}

function PaymentStage({
  state,
  pay,
  go,
  busy,
}: {
  state: "idle" | "failed" | "paid";
  pay: (outcome: "success" | "failure") => void;
  go: (stage: Stage) => void;
  busy: boolean;
}) {
  return (
    <div className="route-content narrow-route">
      <RouteIntro
        eyebrow="Step 04 · Sandbox deposit"
        title="Hold the date"
        accent="not your breath."
        description="No real card, UPI or partner account is connected. This is a safe sandbox simulation."
      />
      <article className="paper-card route-card payment-route-card">
        <div className="sandbox-banner">
          <CreditCard size={16} />
          <strong>Sandbox payment · simulated only</strong>
        </div>
        <div className="payment-amount">
          <span>Deposit due today</span>
          <strong>{formatINR(quote.deposit)}</strong>
          <small>for a {formatINR(quoteTotal)} event estimate</small>
        </div>
        <div className="route-form-grid">
          <label>
            Card number
            <input value="4242 4242 4242 4242" readOnly />
          </label>
          <label>
            Expiry
            <input value="12 / 28" readOnly />
          </label>
          <label>
            CVV
            <input value="123" readOnly />
          </label>
        </div>
        {state === "failed" && (
          <div className="payment-error" role="alert">
            <Info size={15} /> Payment failed in sandbox. Nothing was charged.
          </div>
        )}
        {state === "paid" && (
          <div className="payment-success">
            <CheckCircle2 size={16} /> Deposit recorded in sandbox.{" "}
            <button type="button" onClick={() => go("confirmation")}>
              View confirmation <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="payment-actions">
          <Button className="primary-button" onClick={() => pay("success")} disabled={busy}>
            <ShieldCheck size={15} /> {busy ? "Recording…" : "Simulate successful deposit"}
          </Button>
          <button className="link-button" type="button" onClick={() => pay("failure")} disabled={busy}>
            Simulate failure
          </button>
        </div>
      </article>
    </div>
  );
}

function ConfirmationStage({ brief, selectedArtist }: { brief: EventBrief; selectedArtist: Artist }) {
  return (
    <div className="route-content confirmation-route">
      <div className="success-seal">
        <Check size={25} />
      </div>
      <RouteIntro
        eyebrow="Booking confirmed · sandbox demo"
        title="A good evening"
        accent="is taking shape."
        description="Your sandbox deposit is recorded and the date is held in this demo."
      />
      <article className="paper-card route-card">
        <div className="confirmation-card-head">
          <div>
            <span className="demo-label">EVENT SCHEDULE</span>
            <h2>Aarav’s 30th birthday</h2>
            <p>
              <CalendarDays size={14} /> {brief.date} · {brief.time} · {brief.city}
            </p>
          </div>
          <span className="confirmed-pill">
            <CheckCircle2 size={14} /> Confirmed
          </span>
        </div>
        <div className="schedule-list">
          {schedule.map(([time, title, description]) => (
            <div className="schedule-row" key={time}>
              <span>{time}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="confirmation-footer-note">
          <Info size={15} /> Planning snapshot. Partner contact details arrive after real production booking.
        </div>
        <div className="mini-pick">
          <img src={venue.image} alt={`${venue.name} rooftop venue`} />
          <span>
            <strong>{venue.name}</strong>
            <small>{venue.area}</small>
          </span>
          <CheckCircle2 size={16} />
        </div>
        <div className="mini-pick">
          <img src={selectedArtist.image} alt={`${selectedArtist.name} performing`} />
          <span>
            <strong>{selectedArtist.name}</strong>
            <small>{selectedArtist.role}</small>
          </span>
          <CheckCircle2 size={16} />
        </div>
      </article>
    </div>
  );
}
