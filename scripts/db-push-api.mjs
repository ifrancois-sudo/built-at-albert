#!/usr/bin/env node
// Applies supabase/migrations/*.sql through the Supabase Management API.
//
// This is the route that does not need the Postgres password: it authenticates
// with a personal access token (https://supabase.com/dashboard/account/tokens)
// and runs each file the same way the dashboard SQL editor does.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/db-push-api.mjs [--seed]
//
// Every migration is idempotent, so re-running is safe.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "sdrlrksfefswxtmnjfmx";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is not set.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

async function run(label, sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const body = await response.text();

  if (!response.ok) {
    console.error(`✗ ${label}`);
    console.error(body.slice(0, 2000));
    process.exit(1);
  }

  console.log(`✓ ${label}`);
}

const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

for (const file of files) {
  await run(file, await readFile(path.join(migrationsDir, file), "utf8"));
}

if (process.argv.includes("--seed")) {
  await run("seed.sql", await readFile(path.join(root, "supabase", "seed.sql"), "utf8"));
}

console.log(`\nDone. ${files.length} migration(s) applied to ${PROJECT_REF}.`);
