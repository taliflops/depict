# Mini Promptwatch

Mini Promptwatch is an app that checks claims made by a LLM about a given brand and verifies their
integrity.

## Architecture

Mini Promptwatch is a single Next.js 16 (App Router) app. A React frontend sends a prompt and a URL
to an API route. The route records the run in Postgres. It then checks whether text from Claude's
answer appears on the page at that URL.

```
┌──────────────────────────┐   POST /api {prompt, url}   ┌──────────────────────────┐
│  Browser                 │ ──────────────────────────▶ │  app/api/route.ts        │
│  app/page.tsx (form)     │                             │  1. normalize URL        │
│  app/contexts/           │ ◀────────────────────────── │  2. savePromptRun()  ────┼──▶ Postgres
│    FormContext.tsx       │   "Confirmed" |             │  3. fetch page HTML  ────┼──▶ target site
│  (state + submit)        │   "Inconclusive"            │  4. match Claude output  │
└──────────────────────────┘                             └──────────────────────────┘
```

### Layers

| Layer        | Files                                         | Responsibility                                                                                                                                   |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI           | `app/layout.tsx`, `app/page.tsx`, `app/*.css` | The root layout wraps the app in `FormProvider`. The page shows the Brand / URL / Prompt form and the verdict.                                   |
| Client state | `app/contexts/FormContext.tsx`                | Holds the form state as React context. Checks that brand and URL are filled in, calls `POST /api`, and stores the verdict.                       |
| API          | `app/api/route.ts`                            | Route handler. Adds `https://` to the URL if it is missing, saves the run, scrapes the page, and returns the verdict with status `201`.          |
| Data access  | `lib/db.ts`                                   | A shared `pg` connection pool, kept across hot reloads in dev. Creates the table the first time it is needed. `savePromptRun()` inserts one row. |
| Database     | Postgres                                      | Table `prompt_runs`, described below.                                                                                                            |

### Request flow

1. The user fills in the form and clicks **Check**.
2. `FormContext.onSubmit` checks the inputs and sends `{ prompt, url }` to `/api`. The brand is only
   checked in the browser; it is not sent.
3. The route handler:
   - saves `prompt`, `model`, `url` and a timestamp to `prompt_runs`
   - fetches the target page's HTML
   - looks for each text block of the Claude response in the HTML. If any block is found it returns
     `"Confirmed"`, otherwise `"Inconclusive"`.
4. The verdict is shown under the form.

> **Note:** the Claude response is currently a hard-coded mock in `app/api/route.ts`.
> `@anthropic-ai/sdk` is installed but not yet called.

### Data model

```sql
CREATE TABLE prompt_runs (
  id         BIGSERIAL PRIMARY KEY,
  prompt     TEXT        NOT NULL,
  model      TEXT        NOT NULL,
  url        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Configuration

| Variable                        | Used by          | Purpose                                                                            |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | `lib/db.ts`      | Postgres connection string, e.g. `postgres://user:pass@localhost:5432/promptwatch` |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | — (not used yet) | Anthropic API key                                                                  |

## Getting started

```bash
brew services start postgresql@17   # or any reachable Postgres
echo 'DATABASE_URL=postgres://localhost:5432/postgres' >> .env
npm install
npm run dev
```

Open http://localhost:3000.
