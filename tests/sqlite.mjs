import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { all, end, exec, get, init, run, transaction } from '../lib/sqlite.mjs';

test('sqlite singleton executes queries in a worker', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'utilitas-sqlite-'));
    const dbPath = path.join(dir, 'test.sqlite');
    try {
        const first = await init({ dbPath });
        assert.equal(await init(dbPath), first);
        await exec(`
            CREATE TABLE item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        `);
        const inserted = await run(
            'INSERT INTO item (name) VALUES (?)',
            ['alpha']
        );
        assert.equal(inserted.changes, 1);
        assert.equal(inserted.lastInsertRowid, 1);
        await transaction([
            {
                type: 'run',
                sql: 'INSERT INTO item (name) VALUES (?)',
                params: ['beta'],
            },
            {
                type: 'run',
                sql: 'INSERT INTO item (name) VALUES (@name)',
                params: { name: 'gamma' },
            },
        ]);
        assert.deepEqual(await get(
            'SELECT COUNT(*) AS count FROM item'
        ), { count: 3 });
        assert.deepEqual(await all(
            'SELECT name FROM item ORDER BY id ASC'
        ), [
            { name: 'alpha' },
            { name: 'beta' },
            { name: 'gamma' },
        ]);
    } finally {
        await end();
        await fs.rm(dir, { recursive: true, force: true });
    }
});
