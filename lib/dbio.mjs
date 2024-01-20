import {
    assertSet, ensureArray, ensureString, log as _log, need, throwError,
} from './utilitas.mjs';

import { isPrimary } from './callosum.mjs';

const _NEED = ['mysql2', 'pg'];
const [mysqlDefaultPort, postgresqlDefaultPort] = [3306, 5432];
const [mysqlQuote, postgresqlQuote] = ['`', ''];
const IFSC = 'information_schema';
const orders = { '+': 'ASC', '-': 'DESC' };
const [INSERT, UPDATE, RETURNING] = ['INSERT', 'UPDATE', 'RETURNING'];
const RETURNING_ALL = ` RETURNING *`;
const [fieldId, fieldAny] = ['id', '*'];
const fieldCount = `COUNT(${fieldAny})`;
const direct = { direct: true };
const comparison = ['=', '>', '<', '<>', '!='];
const fieldNoQuote = [fieldAny, fieldCount];
const log = content => _log(content, import.meta.url);
const defaultKey = options => options && options.key ? options.key : fieldId;
const queryOne = async (...args) => (await query(...args))[0];
const assertForce = op => assert(op?.force, "Option 'force' is required.", 500);
const [MYSQL, POSTGRESQL] = ['MYSQL', 'POSTGRESQL'];
const quote = name => `${bracket}${name}${bracket}`;
const join = elements => elements.join(', ');
const assembleDelete = table => `DELETE FROM ${quote(assertTable(table))}`;
const execByQuery = async (...a) => await rawQuery(...distillArguments(...a));
const getProvider = async () => (await init()) && provider;
const encodeVector = async embedding => (await getPgvector()).toSql(embedding);
const cleanSql = sql => sql.replace(/\s+/g, ' ');

let provider, pool, actExecute, bracket, sqlShowTables, placeholder, sqlDesc,
    sqlShowIndexes, fieldCountResult, doublePlaceholder, pgvector;

const init = async (options) => {
    if (options) {
        const _provider = ensureString(options?.provider, { case: 'UP' });
        let port, vector = '';
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
                break;
            default:
                assert(
                    !options?.provider,
                    `Invalid database provider: '${options.provider}'.`, 400
                );
        }
        isPrimary && !options.silent && log(
            `Initialized: ${_provider.toLowerCase()}://${options.user}@`
            + `${options.host}:${options.port || port}/${options.database}`
            + `${vector}`
        );
    }
    assert(pool, 'Database has not been initialized.');
    return pool;
};

const end = async (options) => {
    pool && pool.end();
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

const rawQuery = async (...args) => {
    const conn = await init();
    logCommand(...args);
    return await conn.query(...args);
};

const rawExecute = async (...args) => {
    const conn = await init();
    logCommand(...args);
    return await conn[actExecute](...args);
};

const handleResult = result => {
    switch (provider) {
        case MYSQL: return result[0];
        case POSTGRESQL: return result.rows;
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
    }
};

const assertTable = (table, message, status) => {
    assert(table, message || 'Table is required.', status || 500);
    return table;
};

const assertKeyValue = (key, value) => {
    assert(key, 'Key is required.', 500);
    assertSet(value, 'Value is required.', 500);
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
    let _placeholder;
    switch (provider) {
        case MYSQL:
            _placeholder = placeholder;
            break;
        case POSTGRESQL:
            _placeholder = `$${options?.placeholderIndex || 1}`;
    }
    const val = options?.direct ? value : _placeholder;
    let express = `${getComparison(value) || '='} ${val}`;
    if (Array.isArray(value)) {
        assert(value.length, 'Invalid array value.', 500);
        express = `IN (${val})`;
    } else if (value === null) { express = `IS ${val}`; }
    return `${options?.prefix || ''}${quote(key)} ${express}`;
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
            for (let k in item) {
                switch (provider) {
                    case MYSQL: dupSql.push(`${quote(k)} = ?`); break;
                    case POSTGRESQL: dupSql.push(`${quote(k)} = $${++i}`); break;
                }
                pushValue(values, item[k]);
            }
            switch (provider) {
                case MYSQL:
                    dupSql = ` ON DUPLICATE KEY UPDATE ${join(dupSql)}`;
                    break;
                case POSTGRESQL:
                    dupSql = ` ON CONFLICT (${defaultKey(options)}) DO UPDATE SET ${join(dupSql)}`;
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
        + (~~options?.limit ? ` LIMIT ${~~options.limit}` : '');
};

const tables = async (options) => {
    const resp = await query(sqlShowTables);
    return options?.raw ? resp : resp.map(x => {
        switch (provider) {
            case MYSQL: return Object.values(x)[0];
            case POSTGRESQL: return x.table_name;
        }
    });
};

const desc = async (table, options) => {
    assertTable(table);
    const [resp, result] = [await query(sqlDesc, [table]), {}];
    if (options?.raw) { return resp; }
    switch (provider) {
        case MYSQL: resp.map(x => result[x.Field] = x); break;
        case POSTGRESQL: resp.map(x => result[x.column_name] = x); break;
    }
    return result;
};

const indexes = async (table, options) => {
    assertTable(table);
    const [resp, result] = [await query(sqlShowIndexes, [table]), {}];
    if (options?.raw) { return resp; }
    switch (provider) {
        case MYSQL: resp.map(x => result[x.Key_name] = x); break;
        case POSTGRESQL: resp.map(x => result[x.indexname] = x); break;
    }
    return result;
};

const drop = async (table, options) => {
    assertTable(table);
    assertForce(options);
    const act = {
        [MYSQL]: [query, [`DROP TABLE IF EXISTS ${doublePlaceholder}`, [table]]],
        [POSTGRESQL]: [execute, [`DROP TABLE IF EXISTS ${table}`]],
    }[provider]
    return await act[0](...act[1]);
};

const queryAll = (table, options) =>
    query(`${assembleQuery(table, options)}${assembleTail(options)}`);

const queryByKeyValue = async (table, key, value, options) => {
    const sql = assembleQuery(table, options)
        + assembleKeyValue(key, value)
        + assembleTail(options);
    const resp = await query(sql, [value]);
    return options?.unique ? (resp && resp.length ? resp[0] : null) : resp;
};

const queryById = async (table, id, options) => await queryByKeyValue(
    table, defaultKey(options), id,
    { ...options || {}, unique: !Array.isArray(id) }
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
            }
            resp.key = key;
            !resp.insertId && item.object[key]
                && (resp.insertId = item.object[key]);
            result.push(resp);
            ids.push(resp.insertId);
        } catch (err) { error.push(err); }
    }
    if (!options?.skipEcho && ids.length) {
        switch (provider) {
            case MYSQL:
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
    const sql = assembleQuery(table, { fields: fieldCount })
        + assembleKeyValue(key, value);
    return (await query(sql, [value]))[0][fieldCountResult];
};

const updateByKeyValue = async (table, key, value, fields, options) => {
    assertTable(table);
    const dfKey = defaultKey(options);
    const subfix = assembleKeyValue(key, value, {
        placeholderIndex: Object.keys(fields).length + 1,
    }) + (provider === POSTGRESQL ? (options?.skipEcho ? (
        options?.key ? ` ${RETURNING} ${dfKey}` : ''
    ) : RETURNING_ALL) : '');
    let { sql, values } = assembleUpdate(table, fields, { subfix });
    sql += assembleTail(options);
    const resp = await query(sql, [...values, value]);
    return !options?.skipEcho && provider === MYSQL
        ? await queryByKeyValue(table, key, value, options) : resp;
};

const updateById = async (table, id, fields, options) => {
    const resp = await updateByKeyValue(
        table, defaultKey(options), id, fields, options
    );
    return Array.isArray(id) ? resp : (resp && resp.length ? resp[0] : null);
};

const deleteByKeyValue = async (table, key, value, options) => {
    const sql = assembleDelete(table)
        + assembleKeyValue(key, value)
        + assembleTail(options);
    return await {
        [MYSQL]: query, [POSTGRESQL]: execByQuery,
    }[provider](sql, [value]);
};

const deleteById = async (table, id, options) =>
    await deleteByKeyValue(table, defaultKey(options), id);

const deleteAll = async (table, options) => {
    assertForce(options);
    return await execute(assembleDelete(table));
};

const enableVector = async () => {
    const pgvector = await getPgvector();
    await execute('CREATE EXTENSION IF NOT EXISTS vector');
    // https://github.com/pgvector/pgvector-node?tab=readme-ov-file#node-postgres
    pool.on('connect', pgvector.registerType);
};

export default init;
export {
    _NEED,
    MYSQL,
    POSTGRESQL,
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
    tables,
    updateById,
    updateByKeyValue,
    upsert,
};
