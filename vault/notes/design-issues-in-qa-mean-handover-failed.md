---
title: "Design issues in QA mean the handover failed"
tags: ["qa", "design", "process"]
products: ["cadencedeck", "routewright"]
experiments: []
created: 2026-09-17
updated: 2026-09-19
---

CadenceDeck is on cycle 5 and still at 11.8%. Four of the fourteen open issues are design
issues, not bugs. That ratio is the thing worth paying attention to.

## The distinction that matters

A dev issue means the build does not match the spec. A design issue means the spec was
ambiguous or incomplete, and QA is discovering it three weeks after handover — which is the
most expensive possible moment to discover it.

Across the last three apps, design issues in QA have clustered around the same two things:
empty states and error states. Both get skipped in the Figma review because the review
walks the happy path.

## The cheap fix

Add empty and error states to the design review checklist, and make the reviewer click
through them rather than look at a board. Costs an hour. The alternative is finding them at
cycle 4 and paying for a design revision plus a rebuild plus another QA pass.

## Watch RouteWright

RouteWright is in design right now and the Figma file has not moved in over two weeks. The
trip journal flow is not started and neither are store graphics. If that ships to dev
incomplete, this exact pattern repeats — except worse, because the missing screens will not
even be ambiguous, they will be absent.

Worth an honest conversation about scope before the handover rather than after.
