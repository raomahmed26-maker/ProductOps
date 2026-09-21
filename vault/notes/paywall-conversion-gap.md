---
title: "Why LedgerLane converts at half the category rate"
tags: ["paywall", "pricing", "competitor"]
products: ["ledgerlane"]
experiments: ["EXP-001", "EXP-002"]
created: 2026-08-14
updated: 2026-09-16
---

Trial start rate sat at 2.1% for months against a category median closer to 4%. I kept
assuming the price was wrong. It was not the price.

## What the teardown actually showed

Three of the four apps in the [[Competitive landscape — prosumer finance]] scan lead their
paywall with the annual plan and put a saving badge on it. We led with monthly, on the
theory that the lower number is less frightening. That theory was never tested, it was
just the first thing we built.

## What changed my mind

Two things, neither of them a price experiment:

- Our monthly-to-annual upgrade rate was healthy. People who paid us were happy to commit.
  The problem was at the first decision, not the second.
- Session recordings showed people reading the monthly card, scrolling, and leaving without
  ever seeing the annual option below the fold.

So the hypothesis became about ordering rather than amount. That became EXP-001, which
shipped: annual share went from 31% to 58% with no drop in total conversions.

## What I still do not know

Whether the saving badge or the position did the work. EXP-002 isolates the wording. If
badge wording moves it as much as the reorder did, then the lesson generalises to
TempoClip's paywall too, and probably to CadenceDeck when it ships.

## The broader pattern

Every time I have been sure a conversion problem was about price, it has turned out to be
about what the user could see at the moment they were deciding. Worth checking that
assumption first on the next app before running anything expensive.
