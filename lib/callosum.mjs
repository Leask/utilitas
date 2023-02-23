import {
    assertFunction, basename, ensureInt, ensureString, log as _log,
    once as _once,
} from './utilitas.mjs';

import { availableParallelism } from 'node:os';
import { loop } from './event.mjs';
import { v4 as uuidv4 } from 'uuid';
import cluster from 'cluster';
import color from './color.mjs';

const _get = key => storage[key];
const [CPU_COUNT, SECDFNTN] = [availableParallelism(), 100];
const [GET, READY, SET] = ['GET', 'READY', 'SET'];
const assertKey = key => assert(key, 'Invalid key.', 400);
const countReady = () => Object.values(cluster.workers).filter(x => x.ready).length;
const countWorker = () => Object.keys(cluster.workers).length;
const getListeners = id => id ? listeners[id] : listeners;
const ignore = id => id && delete listeners[id];
const log = content => _log(content, import.meta.url);
const MESSAGE = 'message';
const newMessage = (action, data) => ({ action: assertAction(action), data });
const once = (action, cbf, opts) => on(action, cbf, { once: true, ...opts });
const padWorkerId = id => ensureInt(id, { pad: String(workerCount).length });
const runFunc = (f, a) => Function.isFunction(f) ? f(...a || []) : null;
const storage = {};

let workerCount = CPU_COUNT;

const listeners = {
    ...cluster.isPrimary ? {
        [uuidv4()]: {
            action: SET,
            callback: (data, worker) => engage(
                worker, data.action, _set(data.key, data.value, worker.id)
            ),
        },
        [uuidv4()]: {
            action: GET,
            callback: (data, worker) => engage(
                worker, data.action, _get(data.key)
            ),
        },
    } : {},
};

const workerLog = (content, worker) => _log(
    content, `W${padWorkerId(worker.id)}-P${worker.process.pid}`
);

const assertAction = action => {
    ensureString(action, { case: 'UP' });
    assert(action, 'Invalid action.', 400);
    return action;
}

const assertPrimary = () => assert(
    cluster.isPrimary, 'Only primary process can call this function.', 400
);

const assertWorker = () => assert(
    cluster.isWorker, 'Only workers can call this function.', 400
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
    ~~options?.workerCount && (workerCount = options.workerCount);
    // let
    if (cluster.isPrimary) {
        cluster.on('exit', async (worker, code, signal) => {
            workerLog(`Worker process exit: ${code}`, worker);
            await runFunc(options?.onExit, [worker, code, signal]);
        });
        cluster.on('online', async (worker) => {
            await runFunc(options?.onOnline, [worker]);
        });
        cluster.on('listening', async (worker, address) => {
            await runFunc(options?.onListening, [worker, address]);
        });
        on(READY, async (data, worker) => {
            workerLog(`Worker process ready.`, worker);
            worker.ready = true;
            countReady() >= workerCount && await onceReady(options?.onReady);
        });
        await loop(async () => {
            while (countWorker() < workerCount) { cluster.fork(); }
        }, 3, 10, 0, basename(import.meta.url), { silent: true });
        await runFunc(options?.initPrimary);
    } else {
        process.on('SIGTERM', process.exit);
        report(READY, await runFunc(options?.initWorker, [cluster.worker]));
    }
    process.on(MESSAGE, eventHandler);
    cluster.on(MESSAGE, (worker, msg) => eventHandler(msg, worker));
};

const eventHandler = async (message, worker) => {
    for (let [id, { action, callback, options }] of Object.entries(listeners)) {
        if (action !== message?.action) { continue; }
        await runFunc(callback, [message?.data, worker]);
        options?.once && delete listeners[id];
    }
};

const boardcast = (action, data) => {
    assertPrimary();
    return Object.values(cluster.workers).map(worker => worker.send(
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
    const id = uuidv4();
    const listener = { action: assertAction(action), callback, options };
    return { id, listener: listeners[id] = listener };
};

const _set = (key, value, updatedBy) => storage[key] = {
    value, updatedAt: new Date(), updatedBy: ~~updatedBy
};

const set = (key, value) => {
    assertKey(key);
    if (cluster.isPrimary) { return _set(key, value); }
    const action = uuidv4();
    const resp = new Promise((resolve, reject) => once(action, resolve));
    report(SET, { action, key, value });
    return resp;
};

const get = key => {
    assertKey(key);
    if (cluster.isPrimary) { return _get(key); }
    const action = uuidv4();
    const resp = new Promise((resolve, reject) => once(action, resolve));
    report(GET, { action, key });
    return resp;
};

export {
    boardcast,
    engage,
    get,
    getListeners,
    ignore,
    init,
    on,
    once,
    report,
    set,
};
