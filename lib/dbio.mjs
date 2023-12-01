import {
    assertSet, ensureArray, ensureString, log as _log, need,
} from './utilitas.mjs';

import { isPrimary } from './callosum.mjs';

const _NEED = ['mysql2', 'pg'];
const [mysqlDefaultPort, postgresqlDefaultPort] = [3306, 5432];
const orders = { '+': 'ASC', '-': 'DESC' };
const [fieldId, fieldAny] = ['id', '*'];
const fieldCount = `COUNT(${fieldAny})`;
const comparison = ['=', '>', '<', '<>', '!='];
const fieldNoQuote = [fieldAny, fieldCount];
const log = (content) => _log(content, import.meta.url);
const defaultKey = (options) => options && options.key ? options.key : fieldId;
const queryOne = async (...args) => (await query(...args))[0];
const assertForce = op => assert(op?.force, "Option 'force' is required.", 500);
const [MYSQL, POSTGRESQL] = ['MYSQL', 'POSTGRESQL'];
const quote = name => `${bracket}${name}${bracket}`;
const join = elements => elements.join(', ');

let [provider, pool, actExecute, bracket, actDuplicate] = [];

const init = async (options) => {
    if (options) {
        const _provider = ensureString(options?.provider, { case: 'UP' });
        let port;
        switch (_provider) {
            case MYSQL:
            case 'MARIA':
            case 'MARIADB':
                const mysql = await need('mysql2/promise');
                delete options.provider;
                [provider, pool, port, actExecute, bracket, actDuplicate] = [
                    MYSQL, mysql.createPool(options), mysqlDefaultPort,
                    'execute', '`', 'ON DUPLICATE KEY',
                ];
                break;
            case 'PG':
            case 'POSTGRE':
            case 'PSQL':
            case POSTGRESQL:
                // https://node-postgres.com/apis/pool
                const { Pool } = await need('pg');
                [provider, pool, port, actExecute, bracket, actDuplicate] = [
                    POSTGRESQL, new Pool(options), postgresqlDefaultPort,
                    'query', '', 'ON CONFLICT DO',
                ];
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
        );
    }
    assert(pool, 'Database has not been initialized.', 501);
    return pool;
};

const end = async (options) => {
    pool && pool.end();
    log('Terminated.');
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
    console.log(args);
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

const assertTable = (table, message, status) =>
    assert(table, message || 'Table is required.', status || 500);

const assertKeyValue = (key, value) => {
    assert(key, 'Key is required.', 500);
    assertSet(value, 'Value is required.', 500);
};

// const assertTableKeyValue = (table, key, value) => {
//     assertTable(table);
//     assertKeyValue(key, value);
// };

const assembleQuery = (table, options) => {
    options = options || {};
    assertTable(table);
    const fields = [];
    ensureArray(options.fields).map((field) => {
        fields.push(fieldNoQuote.includes(field) || options.noQuote
            ? field : quote(field));
    });
    if (!fields.length) { fields.push(fieldAny); }
    return `SELECT ${join(fields)} FROM ${quote(table)}`;
};

const rawAssembleKeyValue = (key, value, options) => {
    options = options || {};
    assertKeyValue(key, value);
    const placeholder = { [MYSQL]: '?', [POSTGRESQL]: '$1' }[provider];
    let express = `${getComparison(value) || '='} ${placeholder}`;
    if (Array.isArray(value)) {
        assert(value.length, 'Invalid array value.', 500);
        express = `IN (${placeholder})`;
    } else if (value === null) { express = `IS ${placeholder}`; }
    return `${options.prefix || ''}${quote(key)} ${express}`;
};

const assembleKeyValue = (key, value, options) => {
    options = options || {};
    options.prefix = ' WHERE ';
    return rawAssembleKeyValue(key, value, options);
};

const pushValue = (values, item) => values.push(
    Object.isObject(item) || Array.isArray(item) ? JSON.stringify(item) : item
);

const assembleSet = (data, options) => {
    options = options || {};
    const [isArray, result] = [options.asArray || Array.isArray(data), []];
    ensureArray(data).map((item) => {
        assert(Object.keys(item).length, 'Fields are required.', 500);
        let [keys, vals, values, dupSql] = [[], [], [], []];
        for (let k in item) {
            keys.push(k);
            switch (provider) {
                case MYSQL: vals.push('?'); break;
                case POSTGRESQL: vals.push(`$${vals.length + 1}`); break;
            }
            pushValue(values, item[k]);
        }
        if (options.upsert) {
            for (let k in item) {
                dupSql.push(`${quote(k)} = ?`);
                pushValue(values, item[k]);
            }
            dupSql = ` ${actDuplicate} UPDATE ${join(dupSql)}`;
        } else { dupSql = ''; }
        const sql = `${options.prefix || ''}`
            + `(${join(keys.map(quote))}) VALUES (${join(vals)})${dupSql}`
            + `${options.subfix || ''}`
        result.push({ sql, values, object: item });
    });
    return isArray ? result : result[0];
};

const assembleInsert = (table, data, options) => {
    options = options || {};
    assertTable(table);
    options.prefix = `INSERT INTO ${quote(table)} `;
    return assembleSet(data, options);
};

const assembleUpdate = (table, data, options) => {
    options = options || {};
    assertTable(table);
    options.prefix = `UPDATE ${quote(table)} `;
    return assembleSet(data, options);
};

const assembleDelete = (table) => {
    assertTable(table);
    return `DELETE FROM ${quote(table)}`;
};

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
    let sql = '';
    switch (provider) {
        case MYSQL:
            sql = 'SHOW TABLES';
            break;
        case POSTGRESQL:
            sql = "SELECT * FROM information_schema.tables WHERE table_schema = 'public'";
    }
    const resp = await query(sql);
    return options?.raw ? resp : resp.map(x => {
        switch (provider) {
            case MYSQL: return Object.values(x)[0];
            case POSTGRESQL: return x.table_name;
        }
    });
};

const desc = async (table, options) => {
    assertTable(table);
    const [resp, result] = [await query('DESC ??', [table]), {}];
    if (options?.raw) { return resp; }
    resp.map(x => result[x.Field] = x);
    return result;
};

const indexes = async (table, options) => {
    assertTable(table);
    const [resp, result] = [await query('SHOW INDEXES FROM ??', [table]), {}];
    if (options?.raw) { return resp; }
    resp.map(x => result[x.Key_name] = x);
    return result;
};

const drop = async (table, options) => {
    assertTable(table);
    assertForce(options);
    return await query('DROP TABLE IF EXISTS ??', [table]);
};

const queryAll = (table, options) =>
    query(`${assembleQuery(table, options)}${assembleTail(options)}`);

const queryByKeyValue = async (table, key, value, options) => {
    options = options || {};
    const sql = assembleQuery(table, options)
        + assembleKeyValue(key, value)
        + assembleTail(options);
    const resp = await query(sql, [value]);
    return options.unique ? (resp && resp.length ? resp[0] : null) : resp;
};

const queryById = async (table, id, options) => {
    options = options || {};
    options.unique = !Array.isArray(id);
    return await queryByKeyValue(table, defaultKey(options), id, options);
};

const insert = async (table, fields, options) => {
    options = options || {};
    let [isArray, key, ids, error, result]
        = [Array.isArray(fields), defaultKey(options), [], [], []];
    const subfix = provider === POSTGRESQL ? (options.skipEcho ? (
        options.key ? ` RETURNING ${key}` : ''
    ) : ` RETURNING *`) : '';
    for (let item of assembleInsert(
        table, fields, { ...options, asArray: true, subfix })
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
    if (!options.skipEcho && ids.length) {
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
    return (await query(sql))[0][fieldCount];
};

const countByKeyValue = async (table, key, value) => {
    const sql = assembleQuery(table, { fields: fieldCount })
        + assembleKeyValue(key, value);
    return (await query(sql, [value]))[0][fieldCount];
};

const updateByKeyValue = async (table, key, value, fields, options) => {
    options = options || {};
    assertTable(table);
    let { sql, values } = assembleUpdate(table, fields);
    sql += assembleKeyValue(key, value) + assembleTail(options);
    const resp = await query(sql, [...values, value]);
    return options.skipEcho
        ? resp : await queryByKeyValue(table, key, value, options);
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
    return await query(sql, [value]);
};

const deleteById = (table, id, options) =>
    deleteByKeyValue(table, defaultKey(options), id);

const deleteAll = async (table, options) => {
    assertForce(options);
    return await execute(assembleDelete(table));
};

export default init;
export {
    _NEED,
    assembleInsert,
    assembleQuery,
    assembleSet,
    assembleTail,
    assembleUpdate,
    countAll,
    countByKeyValue,
    deleteAll,
    deleteById,
    deleteByKeyValue,
    desc,
    drop,
    end,
    execute,
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
