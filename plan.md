

## Route architecture and UI system pass — November 2026

The earlier implementation routed every URL to one stateful `Home` component. This pass corrects that structure: discovery remains at `/`, venue and artist detail use dynamic route-level components, and the event → availability → quote → payment → confirmation journey uses a dedicated booking page component with URL stage transitions. The first journey remains the only full-stack slice; the broader roadmap is explicitly not implemented yet.

Icon system: use `lucide-react`, the official React package for the open-source Lucide icon toolkit. Lucide's official React guidance documents standalone optimized inline SVG components, tree-shaking and TypeScript support. Reference: https://lucide.dev/guide/react/ and https://github.com/lucide-icons/lucide.

Typography: switched to `Instrument Serif` for large editorial headings and `Plus Jakarta Sans` for interface/body text. These are Google Fonts references with clear complementary roles: Instrument Serif provides the expressive editorial voice, while Plus Jakarta Sans supplies a geometric, legible UI system. References: https://fonts.google.com/specimen/Instrument+Serif and https://fonts.google.com/specimen/Plus+Jakarta+Sans.
