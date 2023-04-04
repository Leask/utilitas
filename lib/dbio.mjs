import { assertSet, ensureArray, log as _log, need } from './utilitas.mjs';
import { isPrimary } from './callosum.mjs';

const _NEED = ['mysql2'];
const defaultPort = 3306;
const orders = { '+': 'ASC', '-': 'DESC' };
const [fieldId, fieldAny] = ['id', '*'];
const fieldCount = `COUNT(${fieldAny})`;
const comparison = ['=', '>', '<', '<>', '!='];
const fieldNoQuote = [fieldAny, fieldCount];
const log = (content) => _log(content, import.meta.url);
const defaultKey = (options) => options && options.key ? options.key : fieldId;
const queryOne = async (...args) => (await query(...args))[0];
const assertForce = op => assert(op?.force, "Option 'force' is required.", 500);

let pool;

const init = async (options) => {
    if (options) {
        const mysql = await need('mysql2/promise');
        pool = mysql.createPool(options);
        isPrimary && !options.silent && log(
            `Initialized: mysql://${options.user}@${options.host}`
            + `:${options.port || defaultPort}/${options.database} .`
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
    if (~~globalThis.debug > 0 && args && args[0]) { log(`SQL: ${args[0]}`); }
    if (~~globalThis.debug > 1 && args && args[1]) { console.log(args[1]); };
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
    return await conn.execute(...args);
};

const query = async (...args) => {
    return (await rawQuery(...distillArguments(...args)))[0];
};

const execute = async (...args) => {
    return (await rawExecute(...distillArguments(...args)))[0];
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
            ? field : `\`${field}\``);
    });
    if (!fields.length) { fields.push(fieldAny); }
    return `SELECT ${fields.join(', ')} FROM \`${table}\``;
};

const rawAssembleKeyValue = (key, value, options) => {
    options = options || {};
    assertKeyValue(key, value);
    let express = `${getComparison(value) || '='} ?`;
    if (Array.isArray(value)) {
        assert(value.length, 'Invalid array value.', 500);
        express = 'IN (?)';
    } else if (value === null) { express = 'IS ?'; }
    return `${options.prefix || ''}\`${key}\` ${express}`;
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
        let [sql, values, dupSql] = [[], [], []];
        for (let k in item) {
            sql.push(`\`${k}\` = ?`);
            pushValue(values, item[k]);
        }
        if (options.upsert) {
            for (let k in item) {
                dupSql.push(`\`${k}\` = ?`);
                pushValue(values, item[k]);
            }
            dupSql = ` ON DUPLICATE KEY UPDATE ${dupSql.join(', ')}`;
        } else { dupSql = ''; }
        result.push({
            sql: `${options.prefix || ''}SET ${sql.join(', ')}${dupSql}`,
            values, object: item,
        });
    });
    return isArray ? result : result[0];
};

const assembleInsert = (table, data, options) => {
    options = options || {};
    assertTable(table);
    options.prefix = `INSERT INTO \`${table}\` `;
    return assembleSet(data, options);
};

const assembleUpdate = (table, data, options) => {
    options = options || {};
    assertTable(table);
    options.prefix = `UPDATE \`${table}\` `;
    return assembleSet(data, options);
};

const assembleDelete = (table) => {
    assertTable(table);
    return `DELETE FROM \`${table}\``;
};

const assembleTail = (options) => {
    let sort = [];
    ensureArray(options?.order || []).map?.(x => {
        const ord = Object.isObject(x) ? x : { [x]: '+' };
        const key = Object.keys(ord)[0];
        sort.push(`\`${key}\` ${getOrder(ord[key])}`);
    });
    return (sort.length ? ` ORDER BY ${sort.join(', ')}` : '')
        + (~~options?.limit ? ` LIMIT ${~~options.limit}` : '');
};

const tables = async (options) => {
    const resp = await query(`SHOW TABLES`);
    return options?.raw ? resp : resp.map(x => Object.values(x)[0]);
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
    return await query(`DROP TABLE IF EXISTS ??`, [table]);
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
    for (let item of assembleInsert(
        table, fields, { ...options, asArray: true }
    )) {
        try {
            const resp = await execute(item.sql, item.values);
            resp.key = key;
            resp.insertId = !resp.insertId && item.object[key]
                ? item.object[key] : resp.insertId;
            result.push(resp);
            ids.push(resp.insertId);
        } catch (err) { error.push(err); }
    }
    if (!options.skipEcho && ids.length) {
        result = await queryById(table, ids, options);
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
