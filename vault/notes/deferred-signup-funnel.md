---
title: "Deferred signup keeps showing up in the funnel"
tags: ["onboarding", "activation"]
products: ["ledgerlane", "tempoclip"]
experiments: ["EXP-004"]
created: 2026-09-02
updated: 2026-09-12
---

23% of LedgerLane installs abandon on the signup screen without scanning a single receipt.
That is the largest single drop in the funnel and it happens before the product has done
anything for them.

## The argument for deferring it

The account exists so people can export and restore. Neither of those matters in the first
five minutes. Asking for it up front trades a real activation loss for a hypothetical
retention gain.

The competitor that defers signup until export is also the one with the best D7 in the set.
That is correlation, not proof — they do several other things well — but it is enough to
justify the test.

## The argument against

Anonymous users are harder to reach later, and our re-engagement email is currently the
only channel that brings lapsed users back. If deferring signup drops the 30-day account
creation rate below about 60%, we lose more than we gain.

Which is why the guardrail on EXP-004 is account creation over 30 days, not D1.

## Where else this applies

TempoClip's onboarding is seven screens and asks for music library access on screen two,
before the user has any reason to grant it. Same shape of problem, worse version. That is
already queued as EXP-009 and should probably run before the LedgerLane version, since
TempoClip is pre-launch and can ship the change without a migration.
