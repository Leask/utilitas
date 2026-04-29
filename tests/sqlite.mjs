import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';

import {
    SQLITE,
    countAll,
    countByKeyValue,
    deleteByKeyValue,
    desc,
    drop,
    end,
    execute,
    getProvider,
    indexes,
    init,
    insert,
    query,
    queryAll,
    queryByKeyValue,
    queryOne,
    rawExecute,
    rawQuery,
    tables,
    updateById,
    updateByKeyValue,
    upsert,
} from '../lib/dbio.mjs';

test('dbio sqlite provider supports raw calls and wrappers', async () => {
    let sqlitePath;
    try {
        const connection = await init({ provider: SQLITE, silent: true });
        sqlitePath = connection.path;
        assert.ok(sqlitePath);
        assert.equal(await getProvider(), SQLITE);

        await execute(`
            CREATE TABLE item (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                count INTEGER DEFAULT 0
            )
        `);

        const rawInserted = await execute(
            'INSERT INTO item (key, value, count) VALUES (?, ?, ?)',
            ['raw', 'RAW', 1]
        );
        assert.equal(rawInserted.affectedRows, 1);
        assert.equal(rawInserted.insertId, 1);
        assert.deepEqual(await query(
            'SELECT key, value FROM item WHERE key = ?',
            ['raw']
        ), [
            { key: 'raw', value: 'RAW' },
        ]);
        assert.deepEqual(await queryOne(
            'SELECT value FROM item WHERE key = ?',
            ['raw']
        ), { value: 'RAW' });
        assert.deepEqual(await rawQuery(
            'SELECT key FROM item WHERE key = ?',
            ['raw']
        ), [{ key: 'raw' }]);
        assert.equal((await rawExecute(
            'UPDATE item SET count = ? WHERE key = ?',
            [2, 'raw']
        )).affectedRows, 1);

        const wrapped = await insert('item', {
            key: 'wrapped',
            value: 'WRAPPED',
            count: 2,
        });
        assert.equal(wrapped.key, 'wrapped');
        assert.equal(wrapped.value, 'WRAPPED');

        const updated = await upsert('item', {
            key: 'wrapped',
            value: 'UPDATED',
            count: 3,
        }, { key: 'key' });
        assert.equal(updated.value, 'UPDATED');

        const byKey = await queryByKeyValue(
            'item', 'key', 'wrapped', { unique: true }
        );
        assert.equal(byKey.count, 3);

        const byId = await updateById(
            'item', wrapped.id, { value: 'BY_ID' }
        );
        assert.equal(byId.value, 'BY_ID');

        const batch = await insert('item', [
            { key: 'batch-a', value: 'BATCH_A', count: 6 },
            { key: 'batch-b', value: 'BATCH_B', count: 7 },
        ]);
        assert.deepEqual(batch.result.map(x => x.key), [
            'batch-a', 'batch-b',
        ]);

        assert.equal(await init(), connection);
        await connection.transaction([
            {
                type: 'run',
                sql: 'INSERT INTO item (key, value, count) VALUES (?, ?, ?)',
                params: ['tx-array', 'TX_ARRAY', 4],
            },
            {
                type: 'run',
                sql: 'INSERT INTO item (key, value, count) '
                    + 'VALUES (@key, @value, @count)',
                params: { key: 'tx-named', value: 'TX_NAMED', count: 5 },
            },
        ]);

        assert.deepEqual(
            (await queryAll('item', { order: ['id'] })).map(x => x.key),
            [
                'raw', 'wrapped', 'batch-a', 'batch-b',
                'tx-array', 'tx-named',
            ]
        );
        assert.equal(await countAll('item'), 6);
        assert.equal(await countByKeyValue('item', 'id', [1, 2]), 2);
        assert.deepEqual((await updateById(
            'item', [1, 2], { value: 'ARRAY_UPDATE' }
        )).map(x => x.value), ['ARRAY_UPDATE', 'ARRAY_UPDATE']);
        assert.deepEqual(await tables(), ['item']);
        assert.deepEqual(Object.keys(await desc('item')), [
            'id', 'key', 'value', 'count',
        ]);
        assert.ok(Object.keys(await indexes('item')).includes(
            'sqlite_autoindex_item_1'
        ));

        const deleted = await deleteByKeyValue('item', 'key', 'raw');
        assert.equal(deleted.affectedRows, 1);
        assert.equal(await countAll('item'), 5);

        await drop('item', { force: true });
        assert.deepEqual(await tables(), []);

        await execute(`
            CREATE TABLE pair (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                a TEXT NOT NULL,
                b TEXT NOT NULL,
                value TEXT,
                UNIQUE(a, b)
            )
        `);
        await insert('pair', [
            { a: 'x', b: '1', value: 'X1' },
            { a: 'x', b: '2', value: 'X2' },
            { a: 'y', b: '1', value: 'Y1' },
        ]);
        assert.equal((await queryByKeyValue(
            'pair', { a: 'x', b: '1' }, undefined, { unique: true }
        )).value, 'X1');
        assert.equal(await countByKeyValue(
            'pair', { a: 'x', b: '2' }
        ), 1);
        assert.equal((await updateByKeyValue(
            'pair', { a: 'x', b: '2' }, undefined, { value: 'X2B' },
            { unique: true }
        )).value, 'X2B');
        assert.equal((await deleteByKeyValue(
            'pair', { a: 'y', b: '1' }
        )).affectedRows, 1);

        await drop('pair', { force: true });
        assert.deepEqual(await tables(), []);
    } finally {
        await end();
        if (sqlitePath) {
            await Promise.all([
                sqlitePath,
                `${sqlitePath}-journal`,
                `${sqlitePath}-shm`,
                `${sqlitePath}-wal`,
            ].map(file => fs.rm(file, { force: true })));
        }
    }
});
