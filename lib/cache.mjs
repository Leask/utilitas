import { log as _log, need } from './utilitas.mjs';

const log = (content) => _log(content, import.meta.url);

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

export default init;
export {
    init,
    //     set,
    //     get,
    //     mGet,
    //     lPush,
    //     rPush,
    //     lRange,
    //     getList,
    //     del,
    //     lrem,
    //     smartDel,
    //     setWithExpired,
    //     tryLock,
    //     lock,
    //     unLock,
    //     pTryLock,
    //     pUnLock
};

// https://github.com/luin/ioredis

// var getKey = function(type, id, callback) {
//     if (!type || !id) {
//         return callback ? callback('Error cache type or id.') : null;
//     }
//     var key = 'PRSCACHE_' + type.toUpperCase() + '_' + String(id);
//     return callback ? callback(null, key) : key;
// };

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

// var rawSet = function(type, id, data, options, callback) {
//     options = options || {};
//     getKey(type, id, function(err, key) {
//         if (err) {
//             return callback(err);
//         }
//         var value = JSON.stringify(data);
//         if (verbose && globalThis.config.debug) {
//             console.log('Set cache: ' + key + ' = ' + value);
//         }
//         var args = [key, value];
//         for (var i in options) {
//             if (['EX', 'PX'].indexOf(i) !== -1 && options[i]) {
//                 args.push(i, options[i]);
//             }
//             options['NX'] && args.push('NX');
//             options['XX'] && args.push('XX');
//         }
//         globalThis.redis.set(args, callback || function() { });
//     });
// };

// var set = function(type, id, data, callback) {
//     rawSet(type, id, data, {}, callback);
// };

// var setWithExpired = function(type, id, data, ex, nx, callback) {
//     rawSet(type, id, data, { EX: ex, NX: nx }, callback);
// };

// var del = function(type, id, callback) {
//     getKey(type, id, function(err, key) {
//         if (err) {
//             return callback(err);
//         }
//         if (verbose && globalThis.config.debug) {
//             console.log('Del cache: ' + key);
//         }
//         globalThis.redis.del(key, callback || function() { });
//     });
// };

// let lrem = function(type, id, data, callback) {
//     getKey(type, id, function(err, key) {
//         if (err) {
//             return callback(err);
//         }
//         if (globalThis.config.debug) {
//             console.log('Del cache by value: ' + data);
//         }
//         globalThis.redis.lrem(key, 0, data, callback || function() { });
//     });
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

// var get = function(type, id, callback) {
//     getKey(type, id, function(err, key) {
//         if (err) {
//             return callback(err);
//         }
//         if (globalThis.argv.ignore_cache) {
//             return callback(null, null);
//         }
//         globalThis.redis.get(key, function(err, reply) {
//             if (err) {
//                 return callback(err);
//             }
//             var value = null;
//             try {
//                 value = JSON.parse(reply);
//             } catch (err) {
//                 console.log(err);
//                 return callback(err);
//             }
//             if (verbose && globalThis.config.debug) {
//                 console.log('Get cache: ' + key + ' = ' + reply);
//             }
//             callback(null, value);
//         });
//     });
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

// let rawPush = (type, id, left, values, callback) => {
//     getKey(type, id, (err, key) => {
//         if (err) {
//             return callback(err);
//         }
//         if (verbose && globalThis.config.debug) {
//             console.log(`RPUSH ${value} to ${key}`);
//         }
//         callback = callback || function() { };
//         left ? globalThis.redis.lpush(key, values, callback)
//             : globalThis.redis.rpush(key, values, callback);
//     });
// };

// let lPush = (type, id, values, callback) => {
//     rawPush(type, id, true, values, callback);
// };

// let rPush = (type, id, values, callback) => {
//     rawPush(type, id, false, values, callback);
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
