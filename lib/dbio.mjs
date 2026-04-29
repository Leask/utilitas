import {
    assertSet, checkChance, ensureArray, ensureString,
    log as _log, need, throwError,
} from './utilitas.mjs';

import { isPrimary } from './callosum.mjs';
import { getTempPath } from './storage.mjs';

const _NEED = ['mysql2', 'pg'];
const [mysqlDefaultPort, postgresqlDefaultPort] = [3306, 5432];
const [mysqlQuote, postgresqlQuote, sqliteQuote] = ['`', '', '"'];
const IFSC = 'information_schema';
const orders = { '+': 'ASC', ASC: 'ASC', '-': 'DESC', DESC: 'DESC', VECTOR: ' ' };
const [INSERT, UPDATE, RETURNING] = ['INSERT', 'UPDATE', 'RETURNING'];
const RETURNING_ALL = ` RETURNING *`;
const [fieldId, fieldAny] = ['id', '*'];
const fieldCount = `COUNT(${fieldAny})`;
const direct = { direct: true };
const comparison = ['=', '>', '<', '<>', '!=', 'LIKE', 'NOT LIKE'];
const fieldNoQuote = [fieldAny, fieldCount];
const log = content => _log(content, import.meta.url);
const defaultKey = options => options && options.key ? options.key : fieldId;
const queryOne = async (...args) => (await query(...args))[0];
const assertForce = op => assert(op?.force, "Option 'force' is required.", 500);
const [MYSQL, POSTGRESQL, SQLITE] = ['MYSQL', 'POSTGRESQL', 'SQLITE'];
const quote = name => `${bracket}${name}${bracket}`;
const join = elements => elements.join(', ');
const assembleDelete = table => `DELETE FROM ${quote(assertTable(table))}`;
const execByQuery = async (...a) => await rawQuery(...distillArguments(...a));
const getProvider = async () => (await init()) && provider;
const encodeVector = async embedding => (await getPgvector()).toSql(embedding);
const cleanSql = sql => sql.replace(/\s+/g, ' ');

let provider, pool, actExecute, bracket, sqlShowTables, placeholder, sqlDesc,
    sqlShowIndexes, fieldCountResult, doublePlaceholder, pgvector,
    pgCheckedClients = new WeakSet(), workerDb = null,
    sqliteModule = null, workerThreadsModule = null;

const getSqliteModule = async () =>
    sqliteModule || (sqliteModule = await need('node:sqlite', { raw: true }));

const getWorkerThreadsModule = async () => workerThreadsModule
    || (workerThreadsModule = await need('node:worker_threads', { raw: true }));

const normalizeSqliteParams = (params) => {
    if (params === undefined || params === null) { return []; }
    if (Array.isArray(params)) { return params; }
    if (typeof params === 'object') { return params; }
    return [params];
};

const assembleKeyValueParams = value =>
    provider === SQLITE && Array.isArray(value) ? value : [value];

const normalizeKeyValue = (key, value) => {
    if (Object.isObject(key)) { key = Object.entries(key); }
    return Array.isArray(key)
        ? { key, value, params: key.map(x => x[1]) }
        : { key, value, params: assembleKeyValueParams(value) };
};

const callSqliteStatement = (statement, method, params) => {
    const normalized = normalizeSqliteParams(params);
    return Array.isArray(normalized)
        ? statement[method](...normalized)
        : statement[method](normalized);
};

const requireWorkerDb = () => {
    if (!workerDb) {
        throw new Error('SQLite database has not been initialized.');
    }
    return workerDb;
};

const runSqliteWorkerOperation = (operation = {}) => {
    const db = requireWorkerDb();
    const type = String(operation.type || '').trim();
    const sql = String(operation.sql || '');
    if (type === 'exec') {
        db.exec(sql);
        return null;
    }
    if (type === 'run') {
        const result = callSqliteStatement(
            db.prepare(sql), type, operation.params
        );
        return {
            affectedRows: Number(result?.changes || 0),
            changes: Number(result?.changes || 0),
            insertId: Number(result?.lastInsertRowid || 0),
            lastInsertRowid: Number(result?.lastInsertRowid || 0),
        };
    }
    if (type === 'get' || type === 'all') {
        return callSqliteStatement(db.prepare(sql), type, operation.params);
    }
    throw new Error(`Unknown SQLite operation: ${type}`);
};

const getDefaultSqlitePath = () => getTempPath({
    sub: `utilitas-dbio-${Date.now()}-${Math.random()
        .toString(36).slice(2)}.sqlite`,
});

const handleSqliteWorkerCall = async (message = {}, context = {}) => {
    const id = message.id;
    const { path, parentPort } = context;
    try {
        const method = String(message.method || '').trim();
        if (method === 'open') {
            if (!workerDb) {
                const { DatabaseSync } = await getSqliteModule();
                workerDb = new DatabaseSync(path);
            }
            parentPort.postMessage({ id, ok: true, result: null });
            return;
        }
        if (method === 'close') {
            workerDb?.close();
            workerDb = null;
            parentPort.postMessage({ id, ok: true, result: null });
            return;
        }
        if (method === 'transaction') {
            const db = requireWorkerDb();
            const operations = Array.isArray(message.operations)
                ? message.operations : [];
            db.exec('BEGIN');
            try {
                const result = operations.map(runSqliteWorkerOperation);
                db.exec('COMMIT');
                parentPort.postMessage({ id, ok: true, result });
            } catch (error) {
                db.exec('ROLLBACK');
                throw error;
            }
            return;
        }
        const result = runSqliteWorkerOperation({
            type: method,
            sql: message.sql,
            params: message.params,
        });
        parentPort.postMessage({ id, ok: true, result });
    } catch (error) {
        parentPort.postMessage({
            id,
            ok: false,
            error: {
                message: error?.message || String(error),
                stack: error?.stack || '',
            },
        });
    }
};

const startSqliteWorker = async (path) => {
    const { parentPort } = await getWorkerThreadsModule();
    parentPort.on('message', (message) => {
        void handleSqliteWorkerCall(message, { path, parentPort });
    });
};

class SQLiteWorkerPool {
    constructor(path) {
        this.path = path;
        this.worker = null;
        this.nextRequestId = 1;
        this.pending = new Map();
        this.openPromise = null;
        this.closed = false;
    }

    async open() {
        if (this.openPromise) { return await this.openPromise; }
        this.openPromise = this.#call({ method: 'open' });
        try {
            await this.openPromise;
        } finally {
            this.openPromise = null;
        }
    }

    async close() {
        if (this.closed) { return; }
        const worker = this.worker;
        if (!worker) {
            this.closed = true;
            return;
        }
        try {
            await this.#call({ method: 'close' });
        } finally {
            this.closed = true;
            this.worker = null;
            for (const { reject } of this.pending.values()) {
                reject(new Error('SQLite worker closed'));
            }
            this.pending.clear();
            await worker.terminate();
        }
    }

    async exec(sql) { return await this.#call({ method: 'exec', sql }); }
    async run(sql, params = []) {
        return await this.#call({ method: 'run', sql, params });
    }
    async get(sql, params = []) {
        return await this.#call({ method: 'get', sql, params });
    }
    async all(sql, params = []) {
        return await this.#call({ method: 'all', sql, params });
    }
    async transaction(operations = []) {
        return await this.#call({
            method: 'transaction',
            operations: Array.isArray(operations) ? operations : [],
        });
    }
    query(...args) { return this.all(...args); }
    execute(...args) { return this.run(...args); }
    end() { return this.close(); }

    async #ensureWorker() {
        if (this.worker) { return; }
        const { Worker } = await getWorkerThreadsModule();
        const worker = new Worker(`
            import ${JSON.stringify(new URL('./horizon.mjs', import.meta.url).href)};
            import { startSqliteWorker } from ${JSON.stringify(import.meta.url)};
            await startSqliteWorker(${JSON.stringify(this.path)});
        `, {
            eval: true,
            execArgv: process.execArgv.filter(
                arg => !arg.startsWith('--input-type')
            ),
        });
        worker.on('message', (message) => {
            const id = Number(message?.id || 0);
            const pending = this.pending.get(id);
            if (!pending) { return; }
            this.pending.delete(id);
            if (message.ok) {
                pending.resolve(message.result);
                return;
            }
            const error = new Error(
                message?.error?.message || 'SQLite worker failed'
            );
            if (message?.error?.stack) { error.stack = message.error.stack; }
            pending.reject(error);
        });
        worker.on('error', (error) => this.#rejectAll(error));
        worker.on('exit', (code) => {
            if (!this.closed && code !== 0) {
                this.#rejectAll(new Error(`SQLite worker exited: ${code}`));
            }
            this.worker = null;
        });
        this.worker = worker;
    }

    async #call(payload = {}) {
        if (this.closed) {
            return Promise.reject(new Error('SQLite worker is closed'));
        }
        await this.#ensureWorker();
        const id = this.nextRequestId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.worker.postMessage({ ...payload, id });
        });
    }

    #rejectAll(error) {
        for (const { reject } of this.pending.values()) { reject(error); }
        this.pending.clear();
    }
}

const init = async (options) => {
    if (options) {
        const _provider = ensureString(options?.provider, { case: 'UP' });
        let [port, vector, uri] = [null, '', ''];
        switch (_provider) {
            case MYSQL:
            case 'MARIA':
            case 'MARIADB':
                const mysql = await need('mysql2/promise');
                delete options.provider;
                [
                    provider, pool, port, actExecute, bracket, sqlShowTables,
                    placeholder, fieldCountResult,
                ] = [
                        MYSQL, mysql.createPool(options), mysqlDefaultPort,
                        'execute', mysqlQuote, 'SHOW TABLES', '?', fieldCount,
                    ];
                doublePlaceholder = `${placeholder}${placeholder}`;
                [sqlShowIndexes, sqlDesc] = [
                    `SHOW INDEXES FROM ${doublePlaceholder}`,
                    `DESC ${doublePlaceholder}`,
                ];
                uri = `${_provider.toLowerCase()}://${options.user}@`
                    + `${options.host}:${options.port || port}/`
                    + `${options.database}`;
                break;
            case 'PG':
            case 'POSTGRE':
            case 'PSQL':
            case POSTGRESQL:
                // https://node-postgres.com/apis/pool
                const { Pool } = await need('pg');
                [
                    provider, pool, port, actExecute, bracket, placeholder,
                    fieldCountResult,
                ] = [
                        POSTGRESQL, new Pool(options), postgresqlDefaultPort,
                        'query', postgresqlQuote, '$1', 'count',
                    ];
                [sqlShowTables, sqlShowIndexes, sqlDesc] = [
                    [`${IFSC}.tables`, 'table_schema', "'public'", direct],
                    ['pg_indexes', 'tablename', ''],
                    [`${IFSC}.COLUMNS`, 'TABLE_NAME', ''],
                ].map(args => assembleQueryByKeyValue(...args));
                if (options?.vector) {
                    await enableVector();
                    vector = '(vector)';
                }
                uri = `${_provider.toLowerCase()}://${options.user}@`
                    + `${options.host}:${options.port || port}/`
                    + `${options.database}`;
                break;
            case 'SQL':
            case 'SQLITE3':
            case SQLITE:
                const path = options.path || getDefaultSqlitePath();
                [
                    provider, pool, actExecute, bracket, placeholder,
                    fieldCountResult,
                ] = [
                        SQLITE, new SQLiteWorkerPool(path), 'run',
                        sqliteQuote, '?', fieldCount,
                    ];
                await pool.open();
                doublePlaceholder = placeholder;
                [sqlShowTables, sqlShowIndexes, sqlDesc] = [
                    'SELECT name FROM sqlite_master WHERE type = \'table\' '
                    + 'AND name NOT LIKE \'sqlite_%\' ORDER BY name',
                    table => `PRAGMA index_list(${quote(table)})`,
                    table => `PRAGMA table_info(${quote(table)})`,
                ];
                uri = `sqlite://${path}`;
                break;
            default:
                assert(
                    !options?.provider,
                    `Invalid database provider: '${options.provider}'.`, 400
                );
        }
        isPrimary && !options.silent && log(
            `Initialized: ${uri}${vector}`
        );
    }
    assert(pool, 'Database has not been initialized.');
    return pool;
};

const end = async () => {
    if (pool) { await pool.end(); }
    [
        provider, pool, actExecute, bracket, sqlShowTables, placeholder,
        sqlDesc, sqlShowIndexes, fieldCountResult, doublePlaceholder,
        pgvector,
    ] = [];
    pgCheckedClients = new WeakSet();
    log('Terminated.');
};

const getPgvector = async () => {
    assert(
        provider === POSTGRESQL && pool,
        'PostgreSQL has not been initialized.', 501
    );
    return pgvector || (pgvector = await need('pgvector/pg'));
};

const logCommand = (args) => {
    const _args = ensureArray(args);
    if (~~globalThis.debug > 0 && _args && _args[0]) { log(`SQL: ${_args[0]}`); }
    if (~~globalThis.debug > 1 && _args && _args[1]) { console.log(_args[1]); };
};

const getComparison = (val) => Object.isObject(val)
    && comparison.includes(Object.keys(val)[0]) ? Object.keys(val)[0] : null;

const getOrder = (ord) => {
    assert(orders[ord], `Invalid order expression: '${ord}'.`, 400);
    return orders[ord];
};

const distillArguments = (...args) => {
    Array.isArray(args[1]) && args[1].map((v, k) => {
        const cps = getComparison(v); cps && (args[1][k] = v[cps]);
    });
    return args;
};

// https://github.com/pgvector/pgvector-node?tab=readme-ov-file#node-postgres
const call = async (act, ...args) => {
    const conn = await init();
    logCommand(...args);
    if (provider === POSTGRESQL && pgvector) {
        const client = await conn.connect();
        try {
            if (!pgCheckedClients.has(client)) {
                await pgvector.registerType(client);
                pgCheckedClients.add(client);
            }
            return await client[act](...args);
        } finally {
            client.release();
        }
    }
    return await conn[act](...args);
};

const rawQuery = async (...args) => await call('query', ...args);

const rawExecute = async (...args) => await call(actExecute, ...args);

const handleResult = result => {
    switch (provider) {
        case MYSQL: return result[0];
        case POSTGRESQL: return result.rows;
        case SQLITE: return result;
    }
};

const query = async (...args) => handleResult(
    await rawQuery(...distillArguments(...args))
);

const execute = async (...args) => {
    const resp = await rawExecute(...distillArguments(...args));
    switch (provider) {
        case MYSQL: return resp[0];
        case POSTGRESQL: return resp;
        case SQLITE: return resp;
    }
};

const assertTable = (table, message, status) => {
    assert(table, message || 'Table is required.', status || 500);
    return table;
};

const assertKeyValue = (key, value) => {
    assert(key, 'Key is required.', 500);
    assertSet(Array.isArray(key) || value, 'Value is required.', 500);
};

const assembleQueryByKeyValue = (table, key, value, options) =>
    assembleQuery(table) + assembleKeyValue(key, value, options);

// const assertTableKeyValue = (table, key, value) => {
//     assertTable(table);
//     assertKeyValue(key, value);
// };

const assembleQuery = (table, options) => {
    assertTable(table);
    const fields = [];
    ensureArray(options?.fields).map((field) => {
        fields.push(fieldNoQuote.includes(field) || options?.noQuote
            ? field : quote(field));
    });
    if (!fields.length) { fields.push(fieldAny); }
    return `SELECT ${join(fields)} FROM ${quote(table)}`;
};

const rawAssembleKeyValue = (key, value, options) => {
    // TODO: handle JSONB for PostgreSQL only
    // for MySQL, JSON should be stringified before assembling
    assertKeyValue(key, value);
    const [keys, values, conditions] = [[], [], []];
    if (Array.isArray(key)) {
        key.map(([k, v]) => { keys.push(k); values.push(v); });
    } else { keys.push(key); values.push(value); }
    values.map((x, i) => {
        let _placeholder;
        switch (provider) {
            case MYSQL:
            case SQLITE:
                _placeholder = placeholder;
                break;
            case POSTGRESQL:
                _placeholder = `$${options?.placeholderIndex
                    ? options.placeholderIndex + i : (~~i + 1)}`;
        }
        const val = options?.direct ? value : _placeholder;
        let express = `${getComparison(value) || '='} ${val}`;
        if (Array.isArray(value)) {
            assert(value.length, 'Invalid array value.', 500);
            if (provider === SQLITE) {
                express = `IN (${value.map(() => placeholder).join(', ')})`;
            } else {
                express = `IN (${val})`;
            }
        } else if (value === null) { express = `IS ${val}`; }
        conditions.push(`${quote(keys[i])} ${express}`);
    });
    return `${options?.prefix || ''}${conditions.join(` ${options?.operator || 'AND'} `)}`;
};

const assembleKeyValue = (key, value, options) => rawAssembleKeyValue(
    key, value, { ...options || {}, prefix: ' WHERE ' }
);

const pushValue = (values, item) => values.push(
    Object.isObject(item) || Array.isArray(item) ? JSON.stringify(item) : item
);

const assembleSet = (data, options) => {
    assertSet(data, 'Data is required.');
    const [isArray, result] = [options?.asArray || Array.isArray(data), []];
    ensureArray(data).map((item) => {
        assert(Object.keys(item).length, 'Fields are required.', 500);
        let [pairs, keys, vals, values, dupSql, i, sql]
            = [[], [], [], [], [], 0, ''];
        for (let k in item) {
            keys.push(k);
            switch (provider) {
                case MYSQL:
                case SQLITE:
                    vals.push('?');
                    pairs.push(`${quote(k)} = ?`);
                    break;
                case POSTGRESQL:
                    vals.push(`$${++i}`);
                    pairs.push(`${quote(k)} = $${i}`);
            }
            pushValue(values, item[k]);
        }
        if (options?.upsert) {
            switch (provider) {
                case MYSQL:
                case POSTGRESQL:
                    for (let k in item) {
                        switch (provider) {
                            case MYSQL:
                                dupSql.push(`${quote(k)} = ?`);
                                break;
                            case POSTGRESQL:
                                dupSql.push(`${quote(k)} = $${++i}`);
                                break;
                        }
                        pushValue(values, item[k]);
                    }
                    break;
                case SQLITE:
                    for (let k in item) {
                        dupSql.push(`${quote(k)} = excluded.${quote(k)}`);
                    }
                    break;
            }
            switch (provider) {
                case MYSQL:
                    dupSql = ` ON DUPLICATE KEY UPDATE ${join(dupSql)}`;
                    break;
                case POSTGRESQL:
                case SQLITE:
                    dupSql = ' ON CONFLICT '
                        + `(${quote(defaultKey(options))}) DO UPDATE SET `
                        + join(dupSql);
                    break;
            }
        } else { dupSql = ''; }
        switch (options?.action) {
            case INSERT:
                sql = `(${join(keys.map(quote))}) VALUES (${join(vals)})`;
                break;
            case UPDATE:
                sql = `SET ${pairs.join(', ')}`;
                break;
            default:
                throwError(`Invalid action: '${options?.action}'.`, 400);
        }
        sql = `${options?.prefix || ''}${sql}${dupSql}${options?.subfix || ''}`;
        result.push({ sql, values, object: item });
    });
    return isArray ? result : result[0];
};

const assembleInsert = (table, data, options) => assembleSet(data, {
    ...options || {}, action: INSERT,
    prefix: `INSERT INTO ${quote(assertTable(table))} `,
});

const assembleUpdate = (table, data, options) => assembleSet(data, {
    ...options || {}, action: UPDATE,
    prefix: `UPDATE ${quote(assertTable(table))} `,
});

const assembleTail = (options) => {
    let sort = [];
    ensureArray(options?.order || []).map?.(x => {
        const ord = Object.isObject(x) ? x : { [x]: '+' };
        const key = Object.keys(ord)[0];
        sort.push(`${quote(key)} ${getOrder(ord[key])}`);
    });
    return (sort.length ? ` ORDER BY ${join(sort)}` : '')
        + (~~options?.limit ? ` LIMIT ${~~options.limit}` : '')
        + (~~options?.offset ? ` OFFSET ${~~options.offset}` : '');
};

const tables = async (options) => {
    const resp = await query(sqlShowTables);
    return options?.raw ? resp : resp.map(x => {
        switch (provider) {
            case MYSQL: return Object.values(x)[0];
            case POSTGRESQL: return x.table_name;
            case SQLITE: return x.name;
        }
    });
};

const desc = async (table, options) => {
    assertTable(table);
    const sql = typeof sqlDesc === 'function' ? sqlDesc(table) : sqlDesc;
    const params = typeof sqlDesc === 'function' ? [] : [table];
    const [resp, result] = [await query(sql, params), {}];
    if (options?.raw) { return resp; }
    switch (provider) {
        case MYSQL: resp.map(x => result[x.Field] = x); break;
        case POSTGRESQL: resp.map(x => result[x.column_name] = x); break;
        case SQLITE: resp.map(x => result[x.name] = x); break;
    }
    return result;
};

const indexes = async (table, options) => {
    assertTable(table);
    const sql = typeof sqlShowIndexes === 'function'
        ? sqlShowIndexes(table) : sqlShowIndexes;
    const params = typeof sqlShowIndexes === 'function' ? [] : [table];
    const [resp, result] = [await query(sql, params), {}];
    if (options?.raw) { return resp; }
    switch (provider) {
        case MYSQL: resp.map(x => result[x.Key_name] = x); break;
        case POSTGRESQL: resp.map(x => result[x.indexname] = x); break;
        case SQLITE: resp.map(x => result[x.name] = x); break;
    }
    return result;
};

const drop = async (table, options) => {
    assertTable(table);
    assertForce(options);
    const act = {
        [MYSQL]: [query, [`DROP TABLE IF EXISTS ${doublePlaceholder}`, [table]]],
        [POSTGRESQL]: [execute, [`DROP TABLE IF EXISTS ${table}`]],
        [SQLITE]: [execute, [`DROP TABLE IF EXISTS ${quote(table)}`]],
    }[provider]
    return await act[0](...act[1]);
};

const queryAll = (table, options) =>
    query(`${assembleQuery(table, options)}${assembleTail(options)}`);

const queryByKeyValue = async (table, key, value, options) => {
    const where = normalizeKeyValue(key, value);
    const sql = assembleQuery(table, options)
        + assembleKeyValue(where.key, where.value)
        + assembleTail(options);
    const resp = await query(sql, where.params);
    return options?.unique ? (resp && resp.length ? resp[0] : null) : resp;
};

const queryById = async (table, id, options) => await queryByKeyValue(
    table, defaultKey(options), id,
    { ...options || {}, unique: !Array.isArray(id) && !Object.isObject(id) }
);

const insert = async (table, fields, options) => {
    let [isArray, key, ids, error, result]
        = [Array.isArray(fields), defaultKey(options), [], [], []];
    const subfix = provider === POSTGRESQL ? (options?.skipEcho ? (
        options?.key ? ` ${RETURNING} ${key}` : ''
    ) : RETURNING_ALL) : '';
    for (let item of assembleInsert(
        table, fields, { ...options || {}, asArray: true, subfix })
    ) {
        try {
            const resp = await execute(item.sql, item.values);
            if (provider === POSTGRESQL) {
                resp.affectedRows = resp.rowCount;
                await vacuum(table, { auto: true, ...options || {} });
            }
            resp.key = key;
            key !== fieldId && item.object[key]
                ? (resp.insertId = item.object[key])
                : !resp.insertId && item.object[key]
                && (resp.insertId = item.object[key]);
            result.push(resp);
            ids.push(resp.insertId);
        } catch (err) { error.push(err); }
    }
    if (!options?.skipEcho && ids.length) {
        switch (provider) {
            case MYSQL:
            case SQLITE:
                result = await queryById(table, ids, options);
                break;
            case POSTGRESQL:
                result = result.map(x => x.rows).flat();
        }
    }
    if (!isArray) {
        if (error.length) { throw error[0]; }
        return result.length ? result[0] : null;
    }
    return { error, result };
};

const upsert = (table, fields, options) =>
    insert(table, fields, { ...options || {}, upsert: true });

const countAll = async (table) => {
    const sql = assembleQuery(table, { fields: fieldCount });
    return (await query(sql))[0][fieldCountResult];
};

const countByKeyValue = async (table, key, value) => {
    const where = normalizeKeyValue(key, value);
    const sql = assembleQuery(table, { fields: fieldCount })
        + assembleKeyValue(where.key, where.value);
    return (await query(sql, where.params))[0][fieldCountResult];
};

const updateByKeyValue = async (table, key, value, fields, options) => {
    assertTable(table);
    const where = normalizeKeyValue(key, value);
    const dfKey = defaultKey(options);
    const subfix = assembleKeyValue(where.key, where.value, {
        placeholderIndex: Object.keys(fields).length + 1,
    }) + (provider === POSTGRESQL ? (options?.skipEcho ? (
        options?.key ? ` ${RETURNING} ${dfKey}` : ''
    ) : RETURNING_ALL) : '');
    let { sql, values } = assembleUpdate(table, fields, { subfix });
    sql += assembleTail(options);
    const params = [...values, ...where.params];
    const resp = provider === POSTGRESQL
        ? await query(sql, params)
        : await execute(sql, params);
    return !options?.skipEcho && [MYSQL, SQLITE].includes(provider)
        ? await queryByKeyValue(table, where.key, where.value, options) : resp;
};

const updateById = async (table, id, fields, options) => {
    const resp = await updateByKeyValue(
        table, defaultKey(options), id, fields, options
    );
    return Array.isArray(id) ? resp : (resp && resp.length ? resp[0] : null);
};

const deleteByKeyValue = async (table, key, value, options) => {
    const where = normalizeKeyValue(key, value);
    const sql = assembleDelete(table)
        + assembleKeyValue(where.key, where.value)
        + assembleTail(options);
    return await {
        [MYSQL]: query, [POSTGRESQL]: execByQuery, [SQLITE]: execute,
    }[provider](sql, where.params);
};

const deleteById = async (table, id, options) =>
    await deleteByKeyValue(table, defaultKey(options), id);

const deleteAll = async (table, options) => {
    assertForce(options);
    return await execute(assembleDelete(table));
};

const enableVector = async () => {
    pgvector = await getPgvector();
    await execute('CREATE EXTENSION IF NOT EXISTS vector');
};

const vacuum = async (table, options) => {
    assertTable(table);
    if (!checkChance(options?.auto ? options?.chance : 1)) { return; }
    const resp = await execute(`VACUUM ${quote(table)}`);
    log(JSON.stringify(resp));
    return resp;
};

export default init;
export {
    _NEED,
    MYSQL,
    POSTGRESQL,
    SQLITE,
    assembleInsert,
    assembleQuery,
    assembleSet,
    assembleTail,
    assembleUpdate,
    cleanSql,
    countAll,
    countByKeyValue,
    deleteAll,
    deleteById,
    deleteByKeyValue,
    desc,
    drop,
    enableVector,
    encodeVector,
    end,
    execute,
    getPgvector,
    getProvider,
    indexes,
    init,
    insert,
    query,
    queryAll,
    queryById,
    queryByKeyValue,
    queryOne,
    rawAssembleKeyValue,
    rawExecute,
    rawQuery,
    startSqliteWorker,
    tables,
    updateById,
    updateByKeyValue,
    upsert,
    vacuum,
};
