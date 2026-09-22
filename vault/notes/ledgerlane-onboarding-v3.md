---
title: "LedgerLane onboarding v3"
tags: ["onboarding", "activation", "prd"]
products: ["ledgerlane"]
experiments: ["EXP-004"]
created: 2026-09-04
updated: 2026-09-04
---

PRD v3 is the source of truth. This note is the decision log behind the frames.

## What changed

The seven-step wizard is gone. v3 is three screens:

1. Value, with Apple/Google sign-in as a skippable chip — not a wall.
2. First receipt capture. Camera permission is asked here, in context, not on launch.
3. Category confirmation, then home.

Account creation is no longer a step. It waits until the user tries to export a report. That is also the hypothesis in EXP-004; the frames shipped ahead of the experiment so we could stop losing people to a wall we already knew was wrong.

## What did not change

- Activation is still `first_receipt_scan`.
- Tax year and currency default from locale. They live in settings.
- Sample data was cut, not deferred.

## Open question

Anonymous users cannot get the re-engagement email. EXP-004's guardrail (account creation over 30 days staying above 60%) is how we find out whether that matters.
