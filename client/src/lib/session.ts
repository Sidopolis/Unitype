export type EventBrief = {
  occasion: string;
  city: string;
  date: string;
  time: string;
  guests: number;
  budget: number;
  style: string;
};

export const defaultBrief: EventBrief = {
  occasion: "Birthday",
  city: "Jaipur",
  date: "22 Nov 2026",
  time: "18:30–21:30",
  guests: 25,
  budget: 45000,
  style: "Acoustic",
};

const SESSION_KEYS = {
  brief: "rangrez-brief",
  venue: "rangrez-venue",
  artist: "rangrez-artist",
  eventPlan: "rangrez-event-plan",
  quote: "rangrez-quote",
  availabilityDone: "rangrez-availability-done",
} as const;

function isBlankId(value: unknown): boolean {
  return value == null || value === "" || value === "null" || value === "undefined";
}

export function readJsonSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw == null || raw === "") return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonSession(key: string, value: unknown): void {
  try {
    if (isBlankId(value) && (typeof value !== "object" || value === null)) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage is an enhancement; the demo remains usable when blocked.
  }
}

export function readIdSession(key: string): string | null {
  const value = readJsonSession<string | null>(key, null);
  if (typeof value !== "string" || isBlankId(value)) return null;
  return value;
}

export function writeIdSession(key: string, value: string | null): void {
  writeJsonSession(key, value);
}

export function readBriefSession(): EventBrief {
  const brief = readJsonSession<Partial<EventBrief>>(SESSION_KEYS.brief, defaultBrief);
  return {
    occasion: brief.occasion ?? defaultBrief.occasion,
    city: brief.city ?? defaultBrief.city,
    date: brief.date ?? defaultBrief.date,
    time: brief.time ?? defaultBrief.time,
    guests: Number(brief.guests) || defaultBrief.guests,
    budget: Number(brief.budget) || defaultBrief.budget,
    style: brief.style ?? defaultBrief.style,
  };
}

export function writeBriefSession(brief: EventBrief): void {
  writeJsonSession(SESSION_KEYS.brief, brief);
}

export const sessionKeys = SESSION_KEYS;
