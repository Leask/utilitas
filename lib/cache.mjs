import { log as _log, need, trim } from './utilitas.mjs';

const _NEED = ['ioredis'];
const log = (content) => _log(content, import.meta.url);
const get = async key => JSON.parse(await (await init()).get(assertKey(key)));
const del = async key => await (await init()).del(assertKey(key));

let redis;

const defaultOptions = {
    port: 6379, host: '127.0.0.1', family: 4, db: 0, connectTimeout: 1000 * 3,
};

// @todo: adding lru support when redis is not available:
// https://github.com/isaacs/node-lru-cache
const init = async (options) => {
    if ((options = options === '@' ? defaultOptions : options)) {
        const ioredis = await need('ioredis');
        redis = new ioredis(options);
        if (!options.silent) {
            log(`Initialized: redis://${redis.options.host}`
                + `:${redis.options.port}/${redis.options.db} .`);
        }
    }
    assert(redis, 'Redis has not been initialized.', 501);
    return redis;
};

const assertKey = key => {
    assert(key = trim(key, { case: 'UP' }), 'Invalid key.', 500);
    return key;
};

const set = async (key, value, options) => await (await init()).set(
    assertKey(key), JSON.stringify(value), ...options?.extra || []
);

const setEx = async (key, value, ttl, options) => await set(key, value, {
    ...options || {}, extra: ['EX', ttl, ...options?.extra || []]
});

export default init;
export {
    _NEED,
    del,
    get,
    init,
    set,
    setEx,
};


// https://github.com/luin/ioredis

// var getKeys = function(type, ids, callback) {
//     if (!type || !ids || !ids.length) {
//         return callback ? callback('Error cache type or ids.') : null;
//     }
//     var result = [];
//     for (var i in ids) {
//         var id = getKey(type, ids[i]);
//         if (id) {
//             result.push(id);
//         }
//     }
//     return callback ? callback(null, result) : result;
// };

// var findKeys = function(type, preStr, callback) {
//     getKey(type, preStr, function(err, key) {
//         if (err) {
//             return callback(err);
//         }
//         redis.keys(key, callback);
//     });
// };

// var findAndDel = function(type, preStr, callback) {
//     findKeys(type, preStr, function(err, data) {
//         if (err) {
//             return callback(err);
//         }
//         async.eachSeries(data, function(item, cbf) {
//             // console.log('Clean ' + item);
//             redis.del(item, function(err, result) {
//                 if (err) {
//                     console.log(err);
//                 }
//                 cbf();
//             });
//         }, function(result) {
//             callback(null, data.length);
//         });
//     });
// };

// var smartDel = function(type, id, callback) {
//     return /^.*\*$/.test(id)
//         ? findAndDel(type, id, callback) : del(type, id, callback);
// };

// var mGet = function(type, ids, callback) {
//     getKeys(type, ids, function(err, keys) {
//         if (err) {
//             return callback(err);
//         }
//         if (globalThis.argv.ignore_cache) {
//             return callback(null, null);
//         }
//         globalThis.redis.mget(keys, function(err, reply) {
//             if (err) {
//                 return callback(err);
//             }
//             var values = [];
//             for (var i in reply) {
//                 var value = null;
//                 try {
//                     value = JSON.parse(reply[i]);
//                 } catch (err) {
//                     return callback(err);
//                 }
//                 if (value) {
//                     values.push(value);
//                 }
//             }
//             if (verbose && globalThis.config.debug) {
//                 console.log('Get cache: ' + keys + ' = ' + reply);
//             }
//             callback(null, values);
//         });
//     });
// };

// let lRange = (type, id, start, stop, callback) => {
//     getKey(type, id, (err, key) => {
//         if (err) {
//             return callback(err);
//         }
//         if (globalThis.argv.ignore_cache) {
//             return callback(null, null);
//         }
//         globalThis.redis.lrange(key, start, stop, (err, reply) => {
//             if (verbose && globalThis.config.debug) {
//                 console.log('Get list: ' + key + ' = ' + reply);
//             }
//             callback(err, reply);
//         });
//     });
// };

// let getList = (type, id, callback) => {
//     lRange(type, id, 0, -1, callback);
// };

// let tryLock = (key, timeout, callback) => { // 有返回值表示已经被锁，需要等待。
//     get('lock', key, (err, data) => {
//         if (err || data) {
//             return callback(err, true);
//         }
//         lock(key, timeout, (err, data) => {
//             if (err || !data) {
//                 callback(err, true);
//             }
//             callback(err, false);
//         });
//     });
// };

// let lock = (key, timeout, callback) => {
//     timeout = ~~timeout;
//     setWithExpired('lock', key, new Date(), timeout || 30, true, callback);
// };

// let unLock = (key, callback) => {
//     del('lock', key, callback);
// };
