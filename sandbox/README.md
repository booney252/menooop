# Sandbox

A local, single-user tool for making founder videos. Three things:

1. **Inspo** — save other founders' videos and break them down beat by beat.
2. **Ideas** — turn breakdowns into your own ideas and scripts, on a kanban.
3. **Videos** — log how each video performed and see what's working.

No auth, no cloud, no AI, no `.env`. Everything is typed in by hand.

```bash
cd sandbox
npm install
npm run dev        # http://localhost:3000 opens on the dashboard
```

## Data

One SQLite file: `sandbox/data/sandbox.db`, created on first run. Back it up by
copying it. Tables are `inspo`, `ideas`, `videos`; beats are stored as a JSON
array on the row.

**Export CSV** on the dashboard writes all three tables to
`sandbox/data/exports/<timestamp>-<table>.csv`.

## Behaviour

- Every field saves on blur. The only save button is the script editor
  (`Cmd+S` / `Ctrl+S`).
- `n` anywhere outside a text field creates a new idea and opens it.
- Moving an idea to **Posted** (drag, dropdown, or the button) creates a row
  in Videos pre-linked to the idea, once.
- **Copy beats from inspo** copies the linked inspo's beat names and
  *why it works* into the idea, leaving *what happens* blank for your version.
- Platform is detected from the URL (youtube / tiktok / ig / x).
- YouTube URLs get an embedded player on the Inspo screen.

## The beat framework

Twelve default beats, pre-named and blank: Mission, The physical thing,
Doubt on camera, Deep work, Metric drop, Stranger, Character, Handout,
Money / mentor, Small win, Setback, Cliffhanger and ask. Rows can be
reordered, deleted or added on any inspo or idea.

## Stack

Next.js (App Router) + Tailwind, `better-sqlite3`, `marked` for the script
preview. Server actions do the writes; every page is rendered on demand.
