import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, execute, insert, upsert, query, queryOne, queryByKeyValue, queryAll, drop, end } from '../lib/dbio.mjs';
import { test } from 'node:test';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const DBIO_CONFIG = config?.dbio;
const skipReason = !DBIO_CONFIG && 'dbio config is missing from config.json';

test('dbio operations', { skip: skipReason, timeout: 1000 * 60 }, async () => {
    await init(DBIO_CONFIG);
    const table = 'test_dbio';

    // Create table
    await execute(`CREATE TABLE IF NOT EXISTS ${table} (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert
    const key = 'TEST_KEY';
    const value = 'TEST_VALUE';
    const insertResult = await insert(table, { key, value });
    assert.ok(insertResult, 'Insert result should be present');

    // Upsert
    const newValue = 'NEW_TEST_VALUE';
    const upsertResult = await upsert(table, { key, value: newValue }, { key: 'key' });
    assert.ok(upsertResult, 'Upsert result should be present');

    // Query
    const queryResult = await query(`SELECT * FROM ${table} WHERE key = $1`, [key]);
    assert.equal(queryResult[0].value, newValue, 'Value should be updated');

    // Query One
    const queryOneResult = await queryOne(`SELECT * FROM ${table} WHERE key = $1`, [key]);
    assert.equal(queryOneResult.value, newValue, 'Value should be updated (queryOne)');

    // Query By Key Value
    const queryByKeyValueResult = await queryByKeyValue(table, 'key', key, { unique: true });
    assert.equal(queryByKeyValueResult.value, newValue, 'Value should be updated (queryByKeyValue)');

    // Query All
    const queryAllResult = await queryAll(table);
    assert.ok(queryAllResult.length > 0, 'Should return records (queryAll)');

    // Drop table
    await drop(table, { force: true });

    await end();
});
