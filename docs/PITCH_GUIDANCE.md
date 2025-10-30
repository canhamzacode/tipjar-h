# TipJar — Pitch Deck Guidance

This file suggests a concise slide-by-slide structure and speaker notes for pitching TipJar (category: Onchain Finance & RWA). Tailor content and metrics to your audience and time limit.

## Slide 1 — Title

- Product: TipJar
- Tagline: "Social-first micro-payments on Hedera — tip anyone with a handle"
- Presenter, date, contact

## Slide 2 — Problem

- Small-value transfers are expensive or inaccessible for many people.
- Existing payment rails exclude millions without bank accounts.
- Web3 UX is still a barrier for non-technical users.

Speaker note: paint a clear, concrete example — "You want to thank a creator for a tweet, but fees and friction make $1 transfers unrealistic."

## Slide 3 — Solution

- TipJar: send and receive micro-payments using Twitter handle or app.
- Works with or without prior onboarding (pending tips for newcomers).
- Low fees via Hedera, and simple UX for non-crypto-native users.

## Slide 4 — How it works (user flow)

- Person A mentions/DMs TipJar to tip @PersonB.
- If Person B exists and has a wallet: direct transfer queued and completed on Hedera.
- If Person B doesn't exist/has no wallet: Tip recorded as a pending tip. When Person B signs up and connects a wallet, tip is claimable.

Include a small diagram or 3-step flow here.

## Slide 5 — Architecture

- Client (mobile/web) — Next.js app
- Backend — Node.js + Drizzle ORM + Hedera service
- Twitter bot — listens for mentions and dispatches transfers
- DB: users, transactions, pending_tips

## Slide 6 — Traction / Metrics (if available)

- Number of tips / volume to date
- Average tip size
- Claim rate for pending tips
- Retention/activation after receiving pending tip (if tracked)

If you don't have numbers yet, show projections, funnel assumptions, and unit economics using conservative estimates.

## Slide 7 — Competitive advantages

- Social-handle-first UX lowers onboarding friction.
- Hedera: low fees and fast finality make micro-payments practical.
- Supports pending tips enabling viral distribution through existing social networks.

## Slide 8 — Business model

- Optional platform fee on tips (small percentage).
- Partnerships with creators/platforms for white-label tipping.
- Premium features: payout scheduling, analytics, tipping campaigns.

## Slide 9 — Roadmap

- Short term: improve onboarding and pending-tip claim UX, add analytics.
- Mid term: multi-chain token support, fiat on/off ramps.
- Long term: integrate with creator platforms and enable subscriptions/micro-donations.

## Slide 10 — Ask

- What do you need? (funding, partnerships, introductions)
- How much, and what milestones it will hit.

## Appendix / Demo pointers

- Show the flow for a tip to an unregistered user (pending) then claim after onboarding.
- Walkthrough of the backend: how pending tips are stored and processed.

---

Speaker tips:

- Keep slides visual and numbers-driven.
- Use a short demo to show clarity of the UX — especially the pending tip flow.

If you'd like, I can create a one-page slide deck (PowerPoint / Google Slides outline) or produce a 3-minute demo script with exact console commands and screenshots to show the flows end-to-end.
