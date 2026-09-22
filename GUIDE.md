# Product Ops Workspace — owner’s guide

This is the instruction set for running a portfolio of prosumer apps in this workspace: what the tool is, how to wipe the demo and start with your own products, which documents to attach to each app, and how to set up experiments.

The same text lives in the app at `/guide`.

---

## What this tool is

Product Ops is one place to run a small portfolio of mobile apps through a fixed eight-gate process, and to keep every experiment — in-app, business development, or paid promotion — in a single repository.

It is not a file host, not an analytics warehouse, and not a design tool. Those stay where they already live (Drive, Notion, Figma, GA4, PostHog, the store consoles). This workspace is the index and the operating system around them:

- **Where is each product in the pipeline, and is that honest?**
- **Which documents does this gate still need?**
- **Which experiments are running on which app, against which health dimension?**
- **Should this live app be kept, watched, or killed this week?**

Three products, twelve experiments and a handful of vault notes ship as a demo so the screens are not empty. They are placeholders. Your portfolio replaces them.

---

## How it is designed to help portfolio owners

A portfolio fails in predictable ways: documents scatter across tools, status is whatever someone last typed, experiments live in Slack threads, and kill decisions get delayed because the numbers are in six tabs. The workspace is built against those failure modes.

**Status is derived, never asserted.** A product does not stay green because somebody set it green in March. Health comes from evidence — last artifact date, days in the current gate against your own cadence, QA issue rate, store rejections, weekly installs / D1 / D7 against the kill thresholds. If you disagree with a status, you change the evidence, not a dropdown.

**Progressive disclosure, grouped by the decision it supports.** The dashboard shows a handful of signals per product, worst first. Open a product for the eight gates. Open a gate for its documents. Configuration (thresholds, expected days) sits behind a deliberate click. Nothing is grouped by data type.

**Documents are a link registry, not a dump.** Each gate lists the artifacts it cannot close without. You paste the URL, owner, version and approval status. There is one version of the truth, and it is still findable when the author is on holiday.

**One experiment record, three categories.** Paywall tests, Reddit threads and CPI campaigns are the same object: a hypothesis, a primary metric, a guardrail, a pre-registered stop rule, a decision. The dashboard shows experiments per product, coloured by acquisition / activation / retention / monetisation.

**The backlog refills itself.** A finished experiment can queue the follow-up it suggests. ICE scoring happens before debate, so priority is not “whoever spoke last”.

**Live apps have a kill rule.** Defaults are 1,000 weekly installs, D1 55%, D7 15%. Two consecutive weeks under any of those puts the product on kill watch. You can override the numbers per app; you cannot skip writing them down.

**Half-formed thinking has a vault.** Markdown notes, tagged and linked to products and experiments, sit as files in `vault/notes`. They are not tickets and they are not PRDs. Promote a note into an experiment when the idea is ready.

---

## Clean the demo and start with your own portfolio

Do this once. After this, `npm run setup` and a Cloud Agent rebuild will not put the sample apps back.

### 1. Stop treating the sample apps as yours

The six products (LedgerLane, Shutterproof, TempoClip, PlantTrace, CadenceDeck, RouteWright) and experiments EXP-001–012 are fiction. Do not rename them in place. Wipe them.

### 2. Wipe structured data

From the project root:

```bash
npm run db:clear
```

That deletes every product, document link, QA cycle, store submission, weekly metric and experiment. The database schema stays. A marker file `prisma/.workspace-cleared` is written so the next environment boot does not re-seed the demo.

### 3. Optionally archive the demo notes

Vault notes are Markdown files, not database rows, so the previous command leaves them. To move the sample notes out of `vault/notes`:

```bash
npm run db:clear -- --vault
```

They land in `vault/archive/demo/`. Restore later with:

```bash
mv vault/archive/demo/*.md vault/notes/
```

### 4. Confirm the workspace is empty

Start the app (`npm run dev` → [http://localhost:43127](http://localhost:43127)). The dashboard should say **No products yet**. The sidebar product list should be empty.

### 5. Add your first real product

Click **Add a product**, or go to `/products/new`.

Fill in:

| Field | What to write |
| --- | --- |
| Name | The shipped or working title |
| One-line description | What it does, in one sentence |
| Who it is for | The specific user, not “everyone with a phone” |
| Stores | iOS, Android, or both |
| Where it is now | The gate the app is actually in, not where you wish it was |
| Keep / kill thresholds | Leave the defaults unless this app has a different bar |

Picking a starting gate marks every earlier gate **complete** so the pipeline rail is whole. That is how you drop in an app that is already in QA or sitting with App Review. You still need to link the documents those earlier gates required if you want the checklists to be honest.

Save. You land on the product page with eight gates and empty document registries.

### 6. Repeat for every app in the portfolio

Add the rest the same way. Put each one at its real gate. A live app starts at **Live and measured**. An idea with only a gap note starts at **Market research**.

### 7. Do not run these after you have real data

| Command | What it actually does |
| --- | --- |
| `npm run db:seed` | **Wipes your portfolio** and reloads the six sample apps |
| `npm run db:reset` | Drops the database and rebuilds it, then seeds |
| `npm run db:clear` | Wipes products again (safe if you meant to) |

`npm run setup` is now safe: it migrates and seeds **only if the database is empty and you have not cleared it**.

To bring the demo back on purpose: `npm run db:seed`.

---

## Documents needed for each app

The workspace does not store files. For each document you add: **title, type, full URL, owner, status (draft / in review / approved / superseded), version, one-line summary**.

A gate cannot honestly close until every required type below is present and **approved**. Link them on the product page, on the matching gate, via **Add link**.

Use this as the context pack for an app.

### Product record (in this app)

Created when you add the product. This is the spine everything else hangs on.

- Name, tagline, audience, stores
- Current gate
- Kill thresholds (weekly installs, D1, D7)

### Gate 1 — Market research

Evidence that the gap is real and the competitive set is mapped.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| Market gap validation | Who is underserved, why now, why you | Notion / Drive doc |
| Competitive landscape | The cumulative set: who plays, who wins, who is absent | Sheet or board |
| Competitor UI/UX teardown | Flows, information architecture, what they do that you will not | Figma or annotated screenshots |
| Competitor pricing and positioning | Plans, price points, packaging, who they claim to serve | Sheet |

### Gate 2 — PRD and policy docs

The idea is written down, including the legal pack the stores will ask for.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| PRD | Problem, value, users, features, implementation notes, out of scope | Notion / Google Doc |
| Privacy policy | What you collect, why, retention, third parties | Hosted URL the store listing will use |
| Terms of service | The contract with the user, including subscriptions if you have them | Hosted URL |

### Gate 3 — Figma design

What gets built, and what the stores show.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| Figma — app UI/UX | Full app screens, states, empty/error, handoff-ready | Figma file |
| Figma — store graphics | Screenshots, feature graphic, promo assets at store sizes | Figma file |
| Figma — app icon | Icon and adaptive variants | Figma file |

### Gate 4 — Analytics catalogue

The contract with GA4 and PostHog, written **before** the build, so events are not invented in the client.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| Analytics catalogue | User properties, events, parameters and allowed values for GA4 and PostHog | Sheet |

Minimum contents of that catalogue:

- User properties (plan, platform, acquisition source, …)
- Activation event (the one that means “got value”)
- Core loop events
- Paywall / purchase events
- Retention-relevant events
- Naming rules so Android and iOS do not drift

### Gate 5 — Build and debug APKs

A build that QA can actually run.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| Debug build | Debug APK / TestFlight / internal track, with a version label | Drive, Firebase App Distribution, TestFlight |

### Gate 6 — QA cycles

At least **five** cycles, and the **latest** issue rate under **10%**. That is the gate, not “QA happened”.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| QA feedback sheet | One sheet per cycle, or one sheet with a tab per cycle | Sheet |

On the QA gate itself, log each cycle: date, issues found / fixed, issue rate, split of dev vs design vs PRD issues, build label. The chart is drawn from those rows, not from the sheet.

### Gate 7 — Store submission

Submitted, and not sitting on an open rejection.

| Type in the registry | What it is | Typical home |
| --- | --- | --- |
| Store listing | The listing copy, screenshots and data-safety answers as submitted | App Store Connect / Play Console, or a staging doc |

On this gate, also log every submission: platform, version, date, status. If it is rejected, pick a **reason from the controlled list** (privacy disclosure, data safety form, payments, subscriptions, metadata, functionality, …). Free-text reasons do not roll up, so recurring process failures stay invisible.

### Gate 8 — Live and measured

No required document. The context here is weekly numbers.

Paste or type, once a week:

```
weekStart, installs, activation%, d1%, d7%, d30%, revenue, payingUsers
2026-09-15, 1240, 38, 61, 18, 9, 420, 27
```

That paste lives on the product’s **Post-production** tab. The keep / watch / kill verdict is computed from it.

### Vault notes (optional, but this is where context compounds)

Anything that is not yet a PRD or an experiment: a competitive observation, a paywall hunch, a rejection post-mortem. Create at `/vault/new`. In the frontmatter, tag the product:

```yaml
products: ["your-product-slug"]
```

The note then appears on that product’s **Notes** tab. Promote it to an experiment when the sentence will fit the hypothesis form.

### What “enough context” looks like for one app

If you can open the product page and answer all of the following without leaving the workspace, the context pack is complete:

1. What it is, who it is for, and which stores it ships on
2. Which gate it is in, and why that gate has not closed
3. A link to every required document for every completed gate, marked approved
4. For live apps: this week’s installs, activation, D1, D7 against the kill line
5. Which experiments are running, queued and already decided, and which of the four dimensions they target

---

## How to set up experiments

Experiments are first-class. They are not a comment on a product, and they are not a vault note. Every test you run — a paywall change, a Product Hunt launch, a Google CPI campaign — is the same record.

### When to create one

- You can name the change, the audience, the metric, and why you believe it
- You know which product it belongs to
- You are willing to write the stop rule **before** you see results

If you cannot fill the hypothesis sentence, it is still a note. Keep it in the vault until it will.

### 1. Open the form

From the product’s **Experiments** tab, or **Experiment repository → New experiment**, or by promoting a vault note.

An experiment cannot be created until at least one product exists.

### 2. Classify it

| Field | How to choose |
| --- | --- |
| Product | The app this will run on |
| Type | **In-app** (paywall, pricing, onboarding, feature, UI/UX), **Business development** (Product Hunt, Reddit, community, ASO), **Promotional** (Google CPI, regional, ad group) |
| Surface | The specific place the user (or the market) sees the change |
| Health dimension | **Acquisition, activation, retention or monetisation** — which of the four this is meant to move. The dashboard groups by this. |
| Owner | The person who will stop the run, not “the team” |

### 3. Write the hypothesis as a sentence

The form assembles:

> We believe [change] for [audience] will make [metric] go [up/down] [by how much] within [timeframe], because [evidence].

Example: *We believe leading the paywall with the annual plan for users who hit the third receipt scan will make trial start rate go up by 12% within 14 days, because three of four competitors lead with annual and our start rate is half the category median.*

If the idea will not fit that sentence, it is a wish. Do not file it as an experiment yet.

### 4. Pre-register measurement and the stop rule

Required before the run can start (the launch gate blocks **Start run** until these are filled):

- **Primary metric** — one number decides the outcome
- **Guardrail metric** — what must not get worse (usually D7, or install volume on a CPI test)
- **Kill criteria** — the condition under which you stop early
- **Stop date and/or minimum sample size** — the run has an end that was chosen before the chart wiggled

Also worth filling, not gated: secondary metrics, minimum detectable effect, variant summary, link to the Figma / ad / listing the user actually saw.

Save. The record lands in the **backlog** as `EXP-00N`.

### 5. Score it (ICE)

On the experiment page, score **Impact, Confidence, Ease** from 1–10, independently, before you argue about sequence. The backlog ranks by the average. Unscored items sink. This is how a loud idea loses to a boring one with evidence.

### 6. Start the run

When the launch checklist is all green, set status to **Running**. If anything is missing, the workspace refuses. That is the point.

### 7. While it is running

Do not edit the hypothesis to match what you are seeing. If the change itself changed, stop this record and file a new one. Overdue runs (past their own stop date with no decision) float to the top of the Running view.

### 8. Record the result

Baseline value, observed value, sample size, whether the guardrail was breached, and a decision:

| Decision | Meaning |
| --- | --- |
| Ship | Roll it out |
| Iterate | The direction is right; queue a child experiment |
| Kill | Do not do this again; write down why |
| Inconclusive | Not enough to call; say what was missing |

“Interesting” is not a decision. The learning field is mandatory — a future reader should understand the call without you in the room.

### 9. Refill the backlog

A decided experiment can spawn a child. Use that when the result suggests the next test (a different audience, a different price, a follow-up creative). The child inherits product, category, dimension and owner so the lineage stays readable.

### 10. Read them from the dashboard

The portfolio view has **experiments by product**. Each chip is a running (or queued) experiment, coloured by dimension. That is how you see, at a glance, that four apps have acquisition tests and none have a retention test.

Filter the repository by product, dimension or type when you want the library, not the board.

---

## A reasonable first week on a fresh workspace

1. Wipe the demo (`npm run db:clear -- --vault`)
2. Add every app you actually own, parked at its real gate
3. For each app, link the documents that already exist. Leave missing ones unlinked — the checklist is supposed to look incomplete
4. For live apps, paste last week’s GA4 numbers
5. File the experiments that are already running, even if you started them last month, so the dashboard is not lying
6. Put half-formed ideas in the vault, not in the experiment backlog

After that, the weekly habit is: update metrics, move gates whose documents are approved, score new experiment ideas, stop overdue runs.

---

## If something looks wrong

- A product stuck **On track** while nobody has touched it: status ages on artifact dates. Link a document or log a QA cycle and it will move; leaving it idle will stall it after 14 days and abandon it after 30.
- A QA gate that will not go complete: you need five cycles **and** the latest issue rate under 10%.
- An experiment that will not start: open the launch checklist on its page. Fill the red rows.
- Demo apps came back after a rebuild: `npm run db:clear` was not run, or the marker file was deleted. Clear again.
- You want a blank vault as well as a blank database: `npm run db:clear -- --vault`.
