import './lib/horizon.mjs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const normalizeTargets = (items = []) => items
    .map(item => item?.trim().toLowerCase())
    .filter(Boolean);

const cliTargets = normalizeTargets(process.argv.slice(2));
const envTargets = normalizeTargets(process.env.LIB ? process.env.LIB.split(',') : []);
const targets = cliTargets.length ? cliTargets : (envTargets.length ? envTargets : null);
const targetSet = targets ? new Set(targets) : null;

const testsDir = new URL('./tests/', import.meta.url);
const entries = await readdir(testsDir, { withFileTypes: true });

const suites = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.mjs'))
    .map(entry => {
        const name = path.basename(entry.name, '.mjs').toLowerCase();
        return { name, specifier: new URL(entry.name, testsDir).href };
    });

for (const suite of suites) {
    if (targetSet && !targetSet.has(suite.name)) { continue; }
    await import(suite.specifier);
}
