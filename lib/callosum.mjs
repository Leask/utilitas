import {
    assertFunction, basename, ensureArray, ensureInt, ensureString, extract,
    getFuncParams, getRandomItemInArray, log as _log, once as _once, throwError,
    timeout,
} from './utilitas.mjs';

import { end as _end, loop } from './event.mjs';
import cluster from 'cluster';
import color from './color.mjs';
import uoid from './uoid.mjs';

const [MESSAGE, SECDFNTN, SIGTERM, GET, READY, SET, CALL]
    = ['message', 100, 'SIGTERM', 'GET', 'READY', 'SET', 'CALL'];
const { isPrimary, isWorker, worker, workers } = cluster;
const arrayWorkers = () => Object.values(workers);
const assertKey = key => assert(key, 'Invalid key.', 400);
const countReady = () => arrayWorkers().filter(x => x.ready).length;
const countWorker = () => Object.keys(workers).length;
const eventName = basename(import.meta.url);
const getListeners = id => id ? listeners[id] : listeners;
const ignore = id => id && delete listeners[id];
const log = content => _log(content, import.meta.url);
const newCallbackAction = () => uoid({ type: 'CALLBACK' });
const newMessage = (action, data) => ({ action: assertAction(action), data });
const newPresetAction = () => uoid({ type: 'PRESET' });
const newRuntimeAction = () => uoid({ type: 'RUNTIME' });
const once = (action, cbf, opts) => on(action, cbf, { once: true, ...opts });
const runFunc = (f, a) => Function.isFunction(f) ? f(...a || []) : null;
const storage = {};
const assign = (key, val, o) => set(key, val, { assign: true, ...o || {} });
const push = (key, val, o) => set(key, val, { push: true, ...o || {} });
const unshift = (key, val, o) => set(key, val, { unshift: true, ...o || {} });
const queue = (key, val, o) => push(key, val, { shift: o?.length, ...o || {} });
const del = (k, s, o) => set(k, s ? null : undefined, { delete: s, ...o || {} });
const functions = {};
const packFunc = func => ({ params: func.params, options: func.options });

let [forked, workerCount] = [0, null];

// @todo: support workers in browser?
const availableParallelism = async (options) => {
    if (!(workerCount || (workerCount = ~~options?.workerCount))) {
        const { availableParallelism: paralle, cpus } = await import('os');
        workerCount = paralle ? paralle() : cpus().length;
    }
    return workerCount;
};

const padWorkerId = async id =>
    ensureInt(id, { pad: String(await availableParallelism()).length });

const listeners = {
    ...isPrimary ? {
        [newPresetAction()]: {
            action: CALL,
            callback: async (data, worker) => {
                let result, error;
                try {
                    result = await assertFunc(data.func).func(
                        ...ensureArray(data.args) || []
                    );
                } catch (err) {
                    console.error(
                        error = err.message
                        || `Error running function: ${data.func}.`
                    );
                }
                data.action && engage(worker, data.action, { result, error });
            },
        },
    } : {},
};

const workerLog = async (content, worker) => _log(
    content, `${await padWorkerId(worker.id)}@${worker.process.pid}`
);

const assertAction = action => {
    ensureString(action, { case: 'UP' });
    assert(action, 'Invalid action.', 400);
    return action;
};

const assertPrimary = () => assert(
    isPrimary, 'Only primary process can call this function.', 400
);

const assertWorker = () => assert(
    isWorker, 'Only workers can call this function.', 400
);

const onceReady = _once(func => {
    log(`Successfully launched within ${color.yellow(
        Math.round(process.uptime() * SECDFNTN) / SECDFNTN
    )} seconds.`);
    return runFunc(func);
});

// initPrimary: init function for primary process
// initWorker: init function for worker process
// onExit: callback function when a worker is exited
// onListening: callback function when a worker is listening
// onOnline: callback function when a worker is online
// onReady: callback function when all workers are ready (online and finished init)
const init = async (options) => {
    await availableParallelism(options);
    if (isPrimary) {
        cluster.on('exit', async (worker, code, signal) => {
            await workerLog(`Worker ${(signal && `was killed by signal: ${signal}`)
                || (code !== 0 && `exited with error code: ${code}`)
                || 'exited'}.`, worker);
            await runFunc(options?.onExit, [worker, code, signal]);
        }); // https://nodejs.org/api/cluster.html
        cluster.on('online', async (worker) => {
            await runFunc(options?.onOnline, [worker]);
        });
        cluster.on('listening', async (worker, address) => {
            await runFunc(options?.onListening, [worker, address]);
        });
        on(READY, async (data, worker) => {
            await workerLog(data?.message || 'Worker process ready.', worker);
            worker.ready = true;
            countReady() >= await availableParallelism()
                && await onceReady(options?.onReady);
        }); // `data` is the result of initWorker
        await runFunc(options?.initPrimary);
        await loop(async () => {
            while (countWorker() < await availableParallelism()) {
                cluster.fork({ FORKED: ++forked });
            }
        }, 3, 10, 0, eventName, { silent: true });
    } else {
        // https://www.knowledgehut.com/blog/web-development/node-js-process-exit
        process.on(SIGTERM, () => process.exit(12));
        report(READY, await runFunc(options?.initWorker, [cluster.worker]));
    }
};

const eventHandler = async (...args) => {
    const [message, worker] = args[0]?.process?.pid ? [args[1], args[0]] : args;
    for (let [id, { action, callback, options }] of Object.entries(listeners)) {
        if (action !== message?.action) { continue; }
        await runFunc(callback, [message?.data, worker]);
        options?.once && delete listeners[id];
    }
};

const boardcast = (action, data) => {
    assertPrimary();
    return arrayWorkers().map(worker => worker.send(
        newMessage(action, data), undefined, undefined, (e) => { }
    ));
};

const engage = (worker, action, data) => {
    assertPrimary();
    return worker.send(newMessage(action, data));
};

const report = (action, data) => {
    assertWorker();
    return process.send(newMessage(action, data));
};

const on = (action, callback, options) => {
    assertFunction(callback);
    const id = newRuntimeAction();
    const listener = { action: assertAction(action), callback, options };
    return { id, listener: listeners[id] = listener };
};

const register = (name, func, options = {}) => {
    assert(name && func, 'Name and function required.');
    assert(!functions[name], 'Function already registered.');
    return functions[name] = { name, func, params: getFuncParams(func), options };
};

const unregister = name => {
    const func = assertFunc(name);
    delete functions[name];
    return func;
};

const getFunc = (name, options) => {
    const resp = name ? functions[name] : functions;
    assert(resp, 'Function Not Found', 404);
    let result = { ...resp };
    if (!options?.raw) {
        if (name) { result = packFunc(resp); } else {
            for (const name in resp) { result[name] = packFunc(resp[name]); }
        }
    }
    return result;
};

const assertFunc = name => {
    let func;
    assert(name, 'Function name required.');
    assert(func = getFunc(name, { raw: true }), 'Function not registered.');
    return func;
};

const call = async (func, options) => {
    assert(workerCount, 'Callosum has not been initialized.', 500);
    if (isPrimary) {
        return await assertFunc(func).func(...options?.args || []);
    }
    const data = { func, args: options?.args };
    let pmsResp;
    if (!options?.quick) {
        data.action = newCallbackAction();
        pmsResp = new Promise((resolve, reject) => once(data.action, resolve));
    }
    const rptResp = report(CALL, data);
    if (options?.quick) { return rptResp; }
    (pmsResp = await pmsResp)?.error && throwError(pmsResp.error);
    return pmsResp.result;
};

const _set = (k, v, o) => {
    assertKey(k);
    const c = storage?.[k]?.value;
    let value = ((o?.push || o?.unshift) && ensureArray(c)) || (o?.assign && (
        Object.isObject(c) ? c : { ...c ? { _: v } : {} }
    )) || v;
    if (o?.push) { o?.bulk ? value.push(...v) : value.push(v); }
    else if (o?.unshift) { o?.bulk ? value.unshift(...v) : value.unshift(v); }
    else if (o?.assign) { Object.assign(value, v); }
    else if (o?.delete) { value = storage[k].value; delete value[o.delete]; }
    if (~~o?.shift) { while (value.length > ~~o.shift) { value.shift(); } }
    else if (~~o?.pop) { while (value.length > ~~o.pop) { value.pop(); } }
    if (value === undefined) { delete storage[k]; return; }
    return storage[k] = { value, touched_at: new Date() };
};

const _get = (...key) => {
    let options;
    Object.isObject(key?.[key.length - 1]) && (options = key.pop());
    !options?.raw && key.length && key.splice(1, 0, 'value');
    const resp = extract(storage, ...key);
    if (!options?.raw && !key.length) {
        for (let [k, v] of Object.entries(resp)) { resp[k] = v.value; }
    }
    storage[key[0]].touched_at = new Date();
    return resp;
};

const set = async (key, value, options) => await call(
    SET, { args: [key, value, options] },
    { quick: !options?.confirm, ...options || {} }
);

const get = async (...key) => await call(GET, { args: key });

const end = async () => {
    await _end(eventName);
    while (countWorker()) {
        process.kill(getRandomItemInArray(arrayWorkers()).process.pid);
        await timeout();
    }
    log('Terminated.');
};

(isPrimary ? cluster : process).on(MESSAGE, eventHandler);

register(SET, _set);
register(GET, _get);

export default init;
export {
    assertFunc,
    assign,
    boardcast,
    call,
    del,
    end,
    engage,
    get,
    getFunc,
    getListeners,
    ignore,
    init,
    isPrimary,
    isWorker,
    on,
    once,
    push,
    queue,
    register,
    report,
    set,
    unregister,
    unshift,
    worker,
    workers,
};
