# Product Ops Workspace

One place for a small portfolio of prosumer apps: where each product sits in the
production pipeline, which experiments are running against which health
dimension, and the half-formed thinking behind both.

Built around three ideas that come out of how decluttering actually works in
practice, rather than from hiding features:

**Status is derived, never asserted.** A product does not stay green because
somebody set it green in March. Every status is computed from evidence —
artifact timestamps, stage age against your own cadence, QA issue rates, live
metrics against kill thresholds — in a single [`classify()`](src/lib/status.ts).
If you want to argue with a status, you argue with that one function.

**Progressive disclosure, grouped by decision.** The portfolio view shows three
to seven signals per product. Detail is one click away. Configuration sits
behind deliberate intent. Nothing is grouped by data type; everything is grouped
by the decision it supports.

**Documents are indexed, not copied.** Every PRD, Figma file, analytics
catalogue and QA sheet stays where it lives. The workspace holds the link, the
owner, the version and the approval status, tied to the gate it belongs to — so
there is exactly one version of the truth and you can still find it.

## Running it

```bash
npm install
npm run setup   # migrate, generate the client, seed the example portfolio
npm run dev     # http://localhost:43127
```

`npm run setup` migrates and, if the database is empty, loads the sample
portfolio. It will not overwrite data you have already added.

Requires Node 20 or newer. No external services, no credentials, no network
access needed — the database is a single SQLite file at `prisma/workspace.db`.

### Viewing it from anywhere other than localhost

`npm run dev` is for working on `localhost`. Reaching the dev server through
anything else — a plain `127.0.0.1`, a LAN address, a tunnel, or a hosted
preview proxy — trips Next's dev-origin check: the HTML still returns 200 but
every `/_next/static` request 403s, so the page arrives with no styles and no
JavaScript and looks broken rather than erroring.

Either add the exact hostname to `allowedDevOrigins` in
[`next.config.ts`](next.config.ts) (wildcards like `*` are ignored, it wants the
real host), or use:

```bash
npm run preview   # build, then serve on 43127 with no origin restriction
```

Every script binds `::` rather than `0.0.0.0`, which listens on IPv6 and IPv4
together. Binding `0.0.0.0` alone refuses connections from any proxy that
resolves `localhost` to `::1`, which presents as the server being down.

[`.cursor/environment.json`](.cursor/environment.json) installs dependencies and
runs the dev server in a named terminal, so a Cloud Agent boots with the app
already listening on 43127. The seed runs with `--if-empty` there, so a rebuild
never overwrites real data.

## What is in it

### Portfolio dashboard — `/`

- **Pulse strip.** Every product on one axis of days-since-last-update, with the
  stall line at 14 days and the abandoned line at 30. Work piling up on the
  right is work nobody is asking about.
- **Pipeline board.** Four phase columns — pre-production, production, review,
  post-production — with cards showing gate position, days in gate against the
  expected window, and store status while under review.
- **Product cards**, sorted worst-signal-first, each carrying the derived status,
  the next action, and for live apps a compact installs / activation / D1 / D7
  readout against the thresholds.
- **Needs attention**, which lists every rule that fired, worst first.
- **Experiments by product**, so you can see what is running on each app at a
  glance, coloured by which of the four health dimensions it targets.
- **Rejection rollup.** Recurring store rejection causes across the portfolio,
  because the second identical rejection is a process problem, not an app
  problem.

### Product pages — `/products/[slug]`

Phase tabs over the eight gates:

| Phase | Gates |
| --- | --- |
| Pre-production | Market research, PRD and policy docs |
| Production | Figma design, Analytics catalogue, Build and APKs, QA cycles |
| Review | Store submission |
| Post-production | Live and measured |

Each gate carries a checklist of the artifacts it cannot close without, the
document link registry for that gate, and its own instrument panel: the QA cycle
trend against the 10% issue-rate line, the store submission timeline with
controlled-vocabulary rejection reasons, or the weekly metrics table with a
keep / watch / kill verdict.

Thresholds default to 1000 weekly installs, D1 at 55% and D7 at 15%, and can be
overridden per product.

### Experiment repository — `/experiments`

One canonical record per experiment, whether it is a paywall test, a Reddit
post or a CPI campaign. Three views over the same set:

- **Backlog**, ranked by ICE. Score before you argue, so priority reflects
  evidence rather than whoever is loudest in the room.
- **Running**, with overdue runs floated to the top.
- **Library** of decided experiments, filterable by product, dimension and type.

Hypotheses are entered through an enforced sentence — *we believe [change] for
[audience] will make [metric] rise [size] within [timeframe], because
[evidence]* — and a launch gate refuses to start a run until the guardrail
metric and the stop rule are pre-registered. Every finished experiment records
an explicit ship / iterate / kill, and can queue the follow-up it suggests,
which is how the backlog refills itself.

Categories cover in-app (paywall, pricing, onboarding, feature, UI/UX), business
development (Product Hunt, Reddit, community, ASO) and promotional (Google CPI,
regional, ad group).

### Brainstorm vault — `/vault`

Plain Markdown in [`vault/notes`](vault/), deliberately outside the database.
Tag sidebar, full-text search, split-pane editor with live preview, and
`[[wikilinks]]` between notes. An unresolved link points at the create screen,
so following a dead link is how you write the missing note.

Frontmatter `products:` and `experiments:` cross-reference a note onto the
relevant product and experiment pages. Any note can be promoted straight into a
backlog experiment, carrying its text across as the rationale.

Because they are just files, you can open `vault/` in Obsidian and get backlinks
and the graph view for free, and `git log` is the version history.

## Layout

```
prisma/
  schema.prisma       products, stages, documents, QA cycles, submissions, metrics, experiments
  seed.ts             six products across all four phases
src/
  app/                routes: portfolio, products, experiments, vault
  components/         UI, grouped by the screen it serves
  lib/
    status.ts         classify() — the only place status is decided
    taxonomy.ts       every controlled vocabulary in one file
    experiments.ts    ICE scoring, the launch gate, the hypothesis sentence
    vault.ts          Markdown read/write, wikilink resolution
    actions.ts        server actions for everything that writes
vault/notes/          the brainstorm space, as .md files
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 43127, for work on localhost |
| `npm run preview` | Production build served on 43127, reachable from any host |
| `npm run setup` | Migrate, generate the Prisma client, seed only if empty |
| `npm run db:seed` | Reload the sample portfolio (wipes current products) |
| `npm run db:clear` | Wipe products, experiments and metrics; leave the schema |
| `npm run db:clear -- --vault` | Also archive demo notes out of `vault/notes` |
| `npm run db:studio` | Prisma Studio against the SQLite file |
| `npm run db:reset` | Drop and rebuild the database |
| `npm run lint` | ESLint |

## Making it yours

Follow **[GUIDE.md](GUIDE.md)** (also in the app at `/guide`). The short version:

```bash
npm run db:clear              # wipe the six sample apps
npm run db:clear -- --vault   # also archive the sample notes
```

Then **Add a product** in the UI. Do not rename the demo apps in place.

`npm run db:seed` reloads the sample portfolio and **will overwrite your data**. `npm run setup` is safe: it only seeds when the database is empty and has not been cleared.

The rules that decide status live in [`src/lib/status.ts`](src/lib/status.ts) as
named constants at the top of the file — the stall threshold, the QA issue-rate
target, the minimum cycle count, how many consecutive weeks under threshold put
an app on kill watch. Adjust them there and the whole workspace follows.

Gate names, expected durations and required documents are in
[`src/lib/taxonomy.ts`](src/lib/taxonomy.ts), as are the rejection reasons,
experiment surfaces and every other controlled list.
