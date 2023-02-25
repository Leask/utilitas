import {
    assertFunction, basename, ensureInt, ensureString, log as _log,
    once as _once,
} from './utilitas.mjs';

// @todo: support workers in browser?
import { availableParallelism } from 'node:os';
import { loop } from './event.mjs';
import cluster from 'cluster';
import color from './color.mjs';
import uoid from './uoid.mjs';

const _get = key => storage[key];
const [CPU_COUNT, SECDFNTN] = [availableParallelism(), 100];
const [GET, READY, SET] = ['GET', 'READY', 'SET'];
const { isPrimary, isWorker, workers } = cluster;
const arrayWorkers = () => Object.values(workers);
const assertKey = key => assert(key, 'Invalid key.', 400);
const countReady = () => arrayWorkers().filter(x => x.ready).length;
const countWorker = () => Object.keys(workers).length;
const getListeners = id => id ? listeners[id] : listeners;
const ignore = id => id && delete listeners[id];
const log = content => _log(content, import.meta.url);
const MESSAGE = 'message';
const newCallbackAction = () => uoid({ type: 'CALLBACK' });
const newPresetAction = () => uoid({ type: 'PRESET' });
const newRuntimeAction = () => uoid({ type: 'RUNTIME' });
const newMessage = (action, data) => ({ action: assertAction(action), data });
const once = (action, cbf, opts) => on(action, cbf, { once: true, ...opts });
const padWorkerId = id => ensureInt(id, { pad: String(workerCount).length });
const runFunc = (f, a) => Function.isFunction(f) ? f(...a || []) : null;
const storage = {};

let [forked, workerCount] = [0, CPU_COUNT];

const listeners = {
    ...isPrimary ? {
        [newPresetAction()]: {
            action: SET,
            callback: (data, worker) => engage(
                worker, data.action, _set(data.key, data.value, worker.id)
            ),
        },
        [newPresetAction()]: {
            action: GET,
            callback: (data, worker) => engage(
                worker, data.action, _get(data.key)
            ),
        },
    } : {},
};

const workerLog = (content, worker) => _log(
    content, `${padWorkerId(worker.id)}@${worker.process.pid}`
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
    ~~options?.workerCount && (workerCount = options.workerCount);
    // let
    if (isPrimary) {
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
        on(READY, async (data, worker) => { // `data` is the result of initWorker
            workerLog('Worker process ready.', worker);
            worker.ready = true;
            countReady() >= workerCount && await onceReady(options?.onReady);
        });
        await runFunc(options?.initPrimary);
        await loop(async () => {
            while (countWorker() < workerCount) {
                cluster.fork({ FORKED: ++forked });
            }
        }, 3, 10, 0, basename(import.meta.url), { silent: true });
    } else {
        process.on('SIGTERM', process.exit);
        report(READY, await runFunc(options?.initWorker, [cluster.worker]));
    }
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

const _set = (key, value, updatedBy) => storage[key] = {
    value, updatedAt: new Date(), updatedBy: ~~updatedBy
};

const set = (key, value) => {
    assertKey(key);
    if (isPrimary) { return _set(key, value); }
    const action = newCallbackAction();
    const resp = new Promise((resolve, reject) => once(action, resolve));
    report(SET, { action, key, value });
    return resp;
};

const get = key => {
    assertKey(key);
    if (isPrimary) { return _get(key); }
    const action = newCallbackAction();
    const resp = new Promise((resolve, reject) => once(action, resolve));
    report(GET, { action, key });
    return resp;
};

process.on(MESSAGE, eventHandler);
cluster.on(MESSAGE, (worker, msg) => eventHandler(msg, worker));

export default init;
export {
    boardcast,
    engage,
    get,
    getListeners,
    ignore,
    init,
    isPrimary,
    isWorker,
    on,
    once,
    report,
    set,
};
