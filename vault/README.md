# The vault

Plain Markdown. No database, no proprietary format.

`notes/` holds one `.md` file per note, with YAML frontmatter:

```yaml
---
title: "Why our paywall converts half as often as the category"
tags: ["paywall", "pricing"]
products: ["ledgerlane"]
experiments: ["EXP-001"]
created: 2026-08-14
updated: 2026-09-18
---
```

`products` and `experiments` are what make a note appear on the relevant product
or experiment page in the app. Everything else is free-form.

`[[Note title]]` links to another note by its title. If no note has that title
the link points at the create screen, so following a dead link is how you write
the missing note.

## Using this folder in Obsidian

Open `vault/` as a vault. That is the whole setup. Tags, links and frontmatter
are Obsidian's own conventions, so backlinks and the graph view work without any
extra configuration.

Because the files are in the repo, `git log` is the version history.
