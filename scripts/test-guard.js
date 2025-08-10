#!/usr/bin/env node
/*
  Posts .txt files to the /api/guard endpoint and prints JSON results.
  Env vars:
    - BASE_URL (default: http://localhost:3000)
    - ENDPOINT (default: /api/guard)
    - DATA_DIR (default: test-data/guard)
  Usage:
    node scripts/test-guard.js                     # all .txt in DATA_DIR
    node scripts/test-guard.js path/a.txt b.txt    # specific files
*/

const fs = require('fs/promises');
const path = require('path');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ENDPOINT = process.env.ENDPOINT ?? '/api/guard';
const DATA_DIR = process.env.DATA_DIR ?? 'test-data/guard';

const apiUrl = `${BASE_URL.replace(/\/$/, '')}${ENDPOINT}`;

async function listTxtFiles(dir) {
  const absDir = path.resolve(dir);
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.txt'))
    .map((e) => path.join(absDir, e.name))
    .sort((a, b) => a.localeCompare(b));
}

async function postText(text) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const raw = await res.text();
    throw new Error(`Unexpected response (${res.status}): ${raw}`);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const args = process.argv.slice(2);

  let files = args;
  if (files.length === 0) {
    try {
      files = await listTxtFiles(DATA_DIR);
    } catch (err) {
      console.error(`Data directory not found: ${DATA_DIR}`);
      process.exit(1);
    }
  }

  console.error(`Posting files to ${apiUrl}`);

  for (const file of files) {
    try {
      const abs = path.resolve(file);
      const text = await fs.readFile(abs, 'utf8');
      console.error(`== ${abs} ==`);
      const result = await postText(text);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`Error for file ${file}:`, err.message);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


