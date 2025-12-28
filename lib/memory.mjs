import {
    MYSQL, POSTGRESQL, cleanSql, deleteAll, deleteById, getProvider, query,
    queryAll, queryById, upsert,
} from './dbio.mjs';

import { ensureArray, parseJson, trim } from './utilitas.mjs';

const [table, defaultKey] = ['utilitas_memory', { key: 'key' }];
const [pack, unpack] = [val => JSON.stringify(val), val => parseJson(val, val)];

const initSql = {
    [MYSQL]: [[
        cleanSql(`CREATE TABLE IF NOT EXISTS ?? (
            \`key\`        VARCHAR(255) NOT NULL,
            \`value\`      TEXT,
            \`created_at\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY        (\`key\`),
            INDEX   value      (\`value\`(768)),
            INDEX   created_at (\`created_at\`),
            INDEX   updated_at (\`updated_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`), [table],
    ]],
    [POSTGRESQL]: [[
        cleanSql(`CREATE TABLE IF NOT EXISTS ${table} (
            key        VARCHAR(255) NOT NULL,
            value      TEXT,
            created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (key)
        )`)
        // Error: index row size 2776 exceeds btree version 4 maximum 2704 for index "value_index"
        // @todo: Fix this issue, by @Leask.
    ], /* [`CREATE INDEX IF NOT EXISTS value_index ON ${table} (value)`], */[
        `CREATE INDEX IF NOT EXISTS ${table}_created_at_index ON ${table} (created_at)`,
    ], [
        `CREATE INDEX IF NOT EXISTS ${table}_updated_at_index ON ${table} (updated_at)`,
    ]],
};

const init = async () => {
    const provider = await getProvider();
    const _result = [];
    for (let act of initSql[provider]) { _result.push(await query(...act)); }
    return { del, get, set, _result };
};

const assertKey = (key, options) => {
    key = trim(key, { case: 'UP' });
    assert(options?.ignoreError || key, 'Invalid memory key.', 400);
    return key;
};

const handleResult = (resp, options) => {
    if (!options?.skipEcho) {
        ensureArray(resp).map(x => { x.value = unpack(x.value); });
        let result = {};
        if (Array.isArray(resp)) {
            for (let i in resp) {
                result[resp[i].key.split('/').pop()] = resp[i].value;
            }
        } else { result = resp?.value; }
        resp = result;
    }
    return resp;
};

const set = async (key, value, options) => {
    options = { skipEcho: true, ...options || {}, ...defaultKey };
    return handleResult(await upsert(table, {
        key: assertKey(key), value: pack(value), updated_at: new Date()
    }, options), options);
};

const get = async (key, options) => {
    options = { ...options || {}, ...defaultKey };
    let result;
    if ((key = assertKey(key, { ignoreError: true })) && !options?.asPrefix) {
        result = queryById(table, key, options);
    } else if (key && options?.asPrefix) {
        result = queryById(table, { 'LIKE': `${key}/%` }, options);
    } else {
        result = queryAll(table, options);
    }
    return handleResult(await result, options);
};

const del = async (key, options) => {
    options = { ...options || {}, ...defaultKey };
    let result;
    if ((key = assertKey(key, { ignoreError: options?.force })) && !options?.asPrefix) {
        result = deleteById(table, key, options);
    } else if (key && options?.asPrefix) {
        result = deleteById(table, { 'LIKE': `${key}/%` }, options);
    } else {
        result = deleteAll(table, options);
    }
    return await result;
};

export { del, get, init, set };
