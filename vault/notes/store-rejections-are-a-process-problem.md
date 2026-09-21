---
title: "Store rejections are a process problem, not an app problem"
tags: ["publishing", "process", "qa"]
products: ["tempoclip", "planttrace"]
experiments: []
created: 2026-09-10
updated: 2026-09-20
---

Two rejections in a month, both avoidable, neither caused by anything wrong with the
software.

- TempoClip: subscription terms behind a link rather than on the paywall itself.
- PlantTrace: data safety form did not declare the location permission used for frost
  warnings.

## The pattern

Both are disclosure failures at the boundary between the app and the store listing. Nobody
owns that boundary. The developer owns the app, I own the listing, and the thing that
failed sits between the two.

## What would actually fix it

A pre-submission checklist that runs as a QA cycle rather than a mental note. Specifically:

1. Every permission the app requests appears in the data safety or privacy nutrition form.
2. Price, billing period and renewal terms are visible on the paywall screen without a tap.
3. Account deletion is reachable from inside the app, not just support email.
4. Screenshots show only features that exist in the submitted build.

That is four checks. They would have caught both rejections.

## Why track the reasons

One rejection is bad luck. Two of the same kind is a missing step. The rollup on the
portfolio dashboard exists so the second one is impossible to miss — if disclosure keeps
appearing, the fix belongs in the process rather than in the next app.
