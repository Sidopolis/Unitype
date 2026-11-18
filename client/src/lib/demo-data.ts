export type Venue = {
  id: string;
  name: string;
  area: string;
  city: string;
  type: string;
  image: string;
  capacity: number;
  price: number;
  priceBasis: string;
  rating: string;
  reviews: number;
  availability: "Available" | "Enquire" | "Unavailable";
  tags: string[];
  description: string;
  amenities: string[];
  rules: string[];
  minimumHours: number;
};

export type Artist = {
  id: string;
  name: string;
  role: string;
  city: string;
  image: string;
  genre: string;
  languages: string[];
  price: number;
  priceBasis: string;
  rating: string;
  reviews: number;
  availability: "Available" | "Enquire" | "Unavailable";
  duration: string;
  lineup: string;
  tags: string[];
  description: string;
  needs: string[];
  accent: string;
};

export const venue: Venue = {
  id: "amber-courtyard",
  name: "Amber Courtyard",
  area: "C-Scheme, Jaipur",
  city: "Jaipur",
  type: "Rooftop café",
  image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=85",
  capacity: 40,
  price: 18000,
  priceBasis: "per event · 4 hr minimum",
  rating: "4.9",
  reviews: 86,
  availability: "Available",
  tags: ["Rooftop", "Acoustic-friendly", "In-house sound", "Parking"],
  description: "A leafy rooftop with a low stage, warm service and enough breathing room for an easy evening with friends.",
  amenities: ["40 guests seated", "Covered stage", "Basic PA + 2 mics", "Accessible washroom", "Valet parking"],
  rules: ["Outside food is not permitted", "Music until 10:30 pm", "90 min setup access included"],
  minimumHours: 4,
};

export const artists: Artist[] = [
  {
    id: "aarav-mehta",
    name: "Aarav Mehta",
    role: "Acoustic singer-songwriter",
    city: "Jaipur · travels 40 km",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85",
    genre: "Acoustic / Indie",
    languages: ["Hindi", "English"],
    price: 12500,
    priceBasis: "90 min set · 2 breaks",
    rating: "4.8",
    reviews: 42,
    availability: "Available",
    duration: "90 min · 2 x 40 min sets",
    lineup: "Solo + acoustic guitar",
    tags: ["Warm vocals", "Requests welcome", "Low-volume"],
    description: "Gentle, guitar-led sets for rooms where conversation still matters. Aarav brings an easy Hindi-English mix and a small, reliable setup.",
    needs: ["1 vocal mic + stand", "DI box or acoustic amp", "30 min sound check"],
    accent: "#D95B3C",
  },
  {
    id: "the-pink-room",
    name: "The Pink Room",
    role: "Indie-folk duo",
    city: "Jaipur · travels 25 km",
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85",
    genre: "Indie-folk",
    languages: ["Hindi", "English", "Marwari"],
    price: 16500,
    priceBasis: "90 min set · 2 performers",
    rating: "4.7",
    reviews: 29,
    availability: "Enquire",
    duration: "90 min · 2 x 40 min sets",
    lineup: "Vocals + guitar + cajón",
    tags: ["Two-piece", "Storytelling", "Originals"],
    description: "An intimate duo with original songs, soft percussion and a little more lift for the last hour of the evening.",
    needs: ["2 vocal mics", "1 DI box", "45 min sound check"],
    accent: "#46658A",
  },
  {
    id: "saffron-sessions",
    name: "Saffron Sessions",
    role: "Sufi / acoustic trio",
    city: "Jaipur · travels 60 km",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85",
    genre: "Sufi / Acoustic",
    languages: ["Hindi", "Urdu"],
    price: 22000,
    priceBasis: "2 hr set · 3 performers",
    rating: "4.6",
    reviews: 18,
    availability: "Unavailable",
    duration: "2 hr · 2 x 50 min sets",
    lineup: "Vocals + harmonium + percussion",
    tags: ["Sufi", "Rich harmonies", "Fuller sound"],
    description: "A richly layered trio for a room that wants to lean into listening. The requested date is already committed.",
    needs: ["3 vocal / instrument inputs", "Small monitor", "60 min sound check"],
    accent: "#7C806B",
  },
];

export const quote = {
  reference: "RZ-2411",
  validUntil: "18 Nov 2026 · 18:00 IST",
  venueFee: 18000,
  artistFee: 12500,
  productionFee: 1800,
  platformFee: 970,
  taxes: 2970,
  // 50% of pre-tax total (venue + artist + production + platform = 33,270)
  deposit: 16635,
  terms: "Deposit is 50% of the pre-tax booking total. Remaining balance is due 48 hours before the event. Free cancellation until 18 Nov, 18:00 IST.",
};

export const schedule = [
  ["15:30", "Venue access", "Amber Courtyard team opens the rooftop and hands over the stage area."],
  ["16:00", "Setup + styling", "Aarav loads in. Cake table and 25 guest seats are set."],
  ["17:00", "Sound check", "One vocal mic, DI box and acoustic amp checked at low volume."],
  ["18:30", "Guests arrive", "Welcome drinks and cake moment before the first set."],
  ["19:00", "Aarav Mehta live", "Two 40-minute acoustic sets with a short break."],
  ["21:30", "Wrap-up", "Artist load-out and venue reset."],
];

export const heroImages = {
  hero: "/manus-storage/async-images/QcgR6tbVUK0xoYV3YVen95/image-1.webp",
  artist: "/manus-storage/async-images/QcgR6tbVUK0xoYV3YVen95/image-2.webp",
};
