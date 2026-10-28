#!/usr/bin/env node
/**
 * Installs what the app (Alder) needs on a Didit application, as defined in
 * lib/fintech/alder.ts:
 *
 * - "Alder demo: 5,000 EUR or more to a new payee": a transaction rule that
 *   holds the transfer (`AWAITING_USER`) with the step-up workflow;
 * - "Alder demo: sign-in without the passkey": an event rule that declines a
 *   sign-in that failed the passkey check (the account-takeover step).
 *
 * Both only match the demo's own customers (`vendor_data` starting with the
 * Alder prefix).
 *
 * Usage:
 *   npm run setup              # create the rules, or update them
 *   npm run setup -- --dry-run # print the payloads, change nothing
 *
 * Reads API_KEY from the environment or from .env. It also creates the two workflows
 * the app needs and writes their ids to .env.
 * Safe to run any number of times: rules are matched by title, created when
 * missing and PATCHed back to the definition when present.
 *
 * https://docs.didit.me/transaction-monitoring/rules-api
 * https://docs.didit.me/transaction-monitoring/event-rules
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { API_BASE, ensureWorkflows, writeEnv } from "./lib/workflows.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(repoRoot, ".env");

if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

// Loaded in main(), once the workflows exist and their ids are in the environment.
let STEP_UP_WORKFLOW_ID, newPayeeRule, takeoverRule;

const dryRun = process.argv.includes("--dry-run");
const apiKey = process.env.API_KEY;
const base = API_BASE;

async function didit(method, pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${method} ${pathname} returned ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return data;
}

const results = (data) => (Array.isArray(data) ? data : data?.results ?? []);

async function main() {
  if (!apiKey) {
    console.error("API_KEY is not set (environment or .env).");
    process.exit(1);
  }

  console.log(`Didit application behind API_KEY on ${base}\n`);

  const ids = await ensureWorkflows({ apiKey, dryRun });

  ({ STEP_UP_WORKFLOW_ID, newPayeeRule, takeoverRule } = await import("../lib/fintech/alder.ts"));
  console.log("");

  const installed = results(
    await didit("GET", "/v3/transactions/rules/?page_size=500"),
  );
  const rules = [newPayeeRule(STEP_UP_WORKFLOW_ID), takeoverRule()];

  for (const rule of rules) {
    const existing = installed.find((item) => item.title === rule.title);

    if (dryRun) {
      console.log(
        `would ${existing ? "update" : "create"} rule "${rule.title}"\n${JSON.stringify(rule, null, 2)}\n`,
      );
      continue;
    }
    if (existing) {
      await didit("PATCH", `/v3/transactions/rules/${existing.uuid}/`, rule);
      console.log(`updated rule "${rule.title}" ${existing.uuid}`);
    } else {
      const created = await didit("POST", "/v3/transactions/rules/", rule);

      console.log(`created rule "${rule.title}" ${created.uuid}`);
    }
  }


  if (!dryRun) writeEnv(ids);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
