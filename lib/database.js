'use strict';

const defaultId = 'id';

let mysql = null;

const init = (options) => {
    if (options) { mysql = MySQL.createPool(options); }
    utilitas.assert(mysql, 'Database has not been initialized.', 500);
    return mysql;
};

const query = async function() {
    const conn = init();
    return await conn.query.apply(conn, [...arguments]);
};

const execute = async function() {
    const conn = init();
    return await conn.execute.apply(conn, [...arguments]);
};

const assembleSql = (data, options) => {
    options = options || {};
    const [isArray, result] = [options.asArray || Array.isArray(data), []];
    utilitas.ensureArray(data).map((item) => {
        utilitas.assert(Object.keys(item).length, 'Fields are required.', 500);
        const [sql, values] = [[], []];
        for (let k in item) { sql.push(`\`${k}\` = ?`); values.push(item[k]); }
        result.push({ sql: sql.join(', '), values, object: item });
    });
    return isArray ? result : result[0];
};

const assertTableKeyValue = (table, key, value) => {
    utilitas.assert(table, 'Table is required.', 500);
    utilitas.assert(key, 'Key is required.', 500);
    utilitas.assertSet(value, 'Value is required.', 500);
};

const queryByKeyValue = async (table, key, value, options) => {
    options = options || {};
    assertTableKeyValue(table, key, value);
    const sql = `SELECT * FROM \`${table}\` WHERE \`${key}\` `
        + (Array.isArray(value) ? 'IN (?)' : '= ?');
    return (await query(sql, [value]))[0];
};

const queryById = async (table, id, options) => {
    options = options || {};
    const resp = await queryByKeyValue(table, options.key
        || defaultId, id, options);
    return Array.isArray(id) ? resp : (resp && resp.length ? resp[0] : null);
};

const insert = async (table, fields, options) => {
    options = options || {};
    utilitas.assert(table, 'Table is required.', 500);
    let [isArray, key, ids, error, result, sql] = [
        Array.isArray(fields), options.key || defaultId, [], [], [],
        `INSERT INTO \`${table}\` SET `
    ];
    for (let itm of assembleSql(fields, { asArray: true })) {
        try {
            const resp = (await execute(`${sql}${itm.sql}`, itm.values))[0];
            resp.insertId = !resp.insertId && itm.object[key]
                ? itm.object[key] : resp.insertId;
            resp.key = key;
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

const countByKeyValue = async (table, key, value, options) => {
    options = options || {};
    assertTableKeyValue(table, key, value);
    const [sql, values] = [
        `SELECT COUNT(*) FROM \`${table}\` WHERE ?? `
        + (Array.isArray(value) ? 'IN (?)' : '= ?'), [key, value]
    ];
    return (await query(sql, values))[0][0]['COUNT(*)'];
};

const updateByKeyValue = async (table, key, value, fields, options) => {
    options = options || {};
    assertTableKeyValue(table, key, value);
    let { sql, values } = assembleSql(fields);
    sql = `UPDATE \`${table}\` SET ${sql} WHERE \`${key}\` `
        + (Array.isArray(value) ? 'IN (?)' : '= ?');
    values.push(value);
    const resp = (await query(sql, values))[0];
    return options.skipEcho
        ? resp : await queryByKeyValue(table, key, value, options);
};

const updateById = async (table, id, fields, options) => {
    options = options || {};
    const resp = await updateByKeyValue(table, options.key
        || defaultId, id, fields, options);
    return Array.isArray(id) ? resp : (resp && resp.length ? resp[0] : null);
};

const deleteByKeyValue = async (table, key, value, options) => {
    options = options || {};
    assertTableKeyValue(table, key, value);
    const [sql, values] = [
        `DELETE FROM \`${table}\` WHERE ?? `
        + (Array.isArray(value) ? 'IN (?)' : '= ?'), [key, value]
    ];
    return (await query(sql, values))[0];
};

const deleteById = async (table, id, options) => {
    options = options || {};
    return await deleteByKeyValue(table, options.key || defaultId, id, options);
};

module.exports = {
    countByKeyValue,
    deleteById,
    deleteByKeyValue,
    execute,
    init,
    insert,
    query,
    queryById,
    queryByKeyValue,
    updateById,
    updateByKeyValue,
};

const { utilitas } = require('utilitas');
const MySQL = require('mysql2/promise');
