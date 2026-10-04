---
name: feature-doc
description: Write and then close the one document a VorgaVet feature gets, in docs/specs/. Use when the user asks to plan, spec or design a feature before building it, and again when the implementation is finished and the document has to be pruned to its final form. Never create a separate design or plan file.
argument-hint: <feature description, e.g. "client can upload a vaccination card"> or "close" when the work is done
---

# Feature document

Every feature in this repository is **one** Markdown file, `docs/specs/YYYY-MM-DD-<topic>.md`.
There is no separate design file and no separate plan file. The same file is detailed while the
work is being planned and pruned to a clean record when the work lands.

The point of the pruning is that the repository is the source of truth for code. The document
answers **why**, **how** and **where**, so a colleague can find their way without reading a diff.

## Phase 1 — planning, before any code

Create the file with this section order. Status line reads `Status: Planned.`

1. **`# <Feature name>`** and a status line, plus links to the documents this builds on.
2. **`## What this adds`** — what a user can do afterwards, in their words. End with a sentence
   naming what is deliberately out of scope and which document will cover it.
3. **`## Backend contract`** — a table of the endpoints used: call, body, and the rules the UI has
   to respect. Quote the real handler rules, enum values and error codes; read the backend source
   rather than guessing. This is the section hardest to rediscover later, so make it complete.
4. **`## Design`** — the decisions and their reasons, in prose. Where things live, which layer owns
   what, how errors are handled, what happens on failure. No code.
5. **`## Tasks`** — a checkbox list. One line per task saying what it delivers, then one sentence
   on what its tests prove. Keep it to five to eight tasks.
6. **`## Execution detail — delete when closing`** — everything prescriptive: per-task steps, file
   lists, code sketches, commands, expected failure messages. Put all of it here and nowhere else.

That last heading is the whole trick. Anything that is useful only while writing the code goes
under it, so closing the document is a deletion rather than a judgement call.

## Phase 2 — closing, when the work is green

Run when the implementation passes `npx vitest run`, `npx tsc -b` and `npm run lint`.

1. **Delete the entire `## Execution detail` section.** Do not salvage from it except for step 3.
2. **Tick every task** and flip the status line to `Status: Implemented.`
3. **Add `## Where it lives`** — a fenced block, directories in path order, one line per file with
   a short note on what it holds. Mark additions to an existing file with `+`. Name anything that
   was **deleted** in a sentence underneath, because a removal leaves no trace in the code.
4. **Add `## Notes from implementation`**, but only for things a reader would not guess: a library
   quirk, a test-environment trap, a place the code drifted from the design and why. Skip the
   section if there is nothing surprising. Never restate what the code plainly shows.
5. **Update `docs/README.md`** — one row: date, area, topic, a `[document]` link, status.
6. **Add or extend the `docs/CHANGELOG.md` entry** for the session: three to six bullets, the test
   and check counts, and a link to the document.

## What to keep and what to cut

The test for any sentence: **would a reader work this out from the code in under a minute?** If
yes, cut it. If it took a debugging session to learn, keep it.

- Keep: why a module exists, which layer owns it, a backend rule the UI mirrors, a decision that
  looks arbitrary without its reason, a deletion, a deliberate deviation.
- Cut: function bodies, type listings, import lists, per-step commands, expected test output,
  anything that repeats a file the reader can open.

Name a file, function or flag when the reader has to go there. Do not paste it.

## Conventions

- **One document per feature**, in `docs/specs/`. No `-design` suffix, no `plans/` folder.
- **A change that is not a feature** still gets a document, and any shared-code change it makes
  belongs in the app-wide table in
  [the hardening document](../../../docs/specs/2026-09-21-frontend-hardening-before-scheduling.md).
- **Write the document before the code**, and close it in the same session the code lands.
- **Convert relative dates to absolute** in the document. It is read months later.
- **Do not run `git commit`.** The user commits.

## Shape to copy

These are the closed documents to match, shortest first:

| Document | Why it is a good model |
|---|---|
| `docs/specs/2026-09-21-appointments-scheduling-actions.md` | the standard shape at 122 lines |
| `docs/specs/2026-09-21-appointments-visit-flow.md` | a new layer explained without code |
| `docs/specs/2026-09-21-frontend-hardening-before-scheduling.md` | non-feature work, plus the app-wide table |
