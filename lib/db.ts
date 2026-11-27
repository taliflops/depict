import { Pool } from 'pg';

// Reuse one pool across hot reloads in dev so connections don't leak.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

let schemaReady: Promise<unknown> | undefined;

function ensureSchema() {
  schemaReady ??= pool
    .query(`
      CREATE TABLE IF NOT EXISTS prompt_runs (
        id         BIGSERIAL PRIMARY KEY,
        prompt     TEXT        NOT NULL,
        model      TEXT        NOT NULL,
        url        TEXT        NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    .catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  return schemaReady;
}

export type PromptRun = {
  id: string;
  prompt: string;
  model: string;
  url: string;
  created_at: Date;
};

export async function savePromptRun(run: {
  prompt: string;
  model: string;
  url: string;
}): Promise<PromptRun> {
  await ensureSchema();
  const { rows } = await pool.query<PromptRun>(
    `INSERT INTO prompt_runs (prompt, model, url)
     VALUES ($1, $2, $3)
     RETURNING id, prompt, model, url, created_at`,
    [run.prompt, run.model, run.url],
  );
  return rows[0];
}
