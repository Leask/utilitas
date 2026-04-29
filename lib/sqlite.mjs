import {
    isMainThread,
    parentPort,
    workerData,
    Worker,
} from 'node:worker_threads';

import { DatabaseSync } from 'node:sqlite';

let workerDb = null;
let database = null;
let initPromise = null;

const normalizeParams = (params) => {
    if (params === undefined || params === null) { return []; }
    if (Array.isArray(params)) { return params; }
    if (typeof params === 'object') { return params; }
    return [params];
};

const normalizeOptions = (options = {}) => typeof options === 'string'
    ? { dbPath: options }
    : { ...options };

const callStatement = (statement, method, params) => {
    const normalized = normalizeParams(params);
    return Array.isArray(normalized)
        ? statement[method](...normalized)
        : statement[method](normalized);
};

const requireWorkerDb = () => {
    if (!workerDb) {
        throw new Error('Async database is not open');
    }
    return workerDb;
};

const requireDatabase = async () => {
    if (!database) {
        await init();
    }
    return database;
};

const runWorkerOperation = (operation = {}) => {
    const db = requireWorkerDb();
    const type = String(operation.type || '').trim();
    const sql = String(operation.sql || '');
    if (type === 'exec') {
        db.exec(sql);
        return null;
    }
    if (type === 'run') {
        const statement = db.prepare(sql);
        const result = callStatement(statement, type, operation.params);
        return {
            changes: Number(result?.changes || 0),
            lastInsertRowid: Number(result?.lastInsertRowid || 0),
        };
    }
    if (type === 'get' || type === 'all') {
        const statement = db.prepare(sql);
        return callStatement(statement, type, operation.params);
    }
    throw new Error(`Unknown async database operation: ${type}`);
};

const postWorkerMessage = (message) => parentPort.postMessage(message);

const handleWorkerCall = async (message = {}) => {
    const id = message.id;
    try {
        const method = String(message.method || '').trim();
        if (method === 'open') {
            if (!workerDb) {
                workerDb = new DatabaseSync(workerData?.dbPath);
            }
            postWorkerMessage({ id, ok: true, result: null });
            return;
        }
        if (method === 'close') {
            if (workerDb) {
                workerDb.close();
                workerDb = null;
            }
            postWorkerMessage({ id, ok: true, result: null });
            return;
        }
        if (method === 'transaction') {
            const db = requireWorkerDb();
            const operations = Array.isArray(message.operations)
                ? message.operations
                : [];
            db.exec('BEGIN');
            try {
                const results = operations.map((operation) =>
                    runWorkerOperation(operation)
                );
                db.exec('COMMIT');
                postWorkerMessage({ id, ok: true, result: results });
            } catch (error) {
                db.exec('ROLLBACK');
                throw error;
            }
            return;
        }
        const result = runWorkerOperation({
            type: method,
            sql: message.sql,
            params: message.params,
        });
        postWorkerMessage({ id, ok: true, result });
    } catch (error) {
        postWorkerMessage({
            id,
            ok: false,
            error: {
                message: error?.message || String(error),
                stack: error?.stack || '',
            },
        });
    }
};

if (!isMainThread) {
    parentPort.on('message', (message) => {
        void handleWorkerCall(message);
    });
}

class AsyncDatabaseSync {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.worker = null;
        this.nextRequestId = 1;
        this.pending = new Map();
        this.openPromise = null;
        this.closed = false;
    }

    async open() {
        if (this.closed) {
            throw new Error('Async database is closed');
        }
        if (this.openPromise) {
            return await this.openPromise;
        }
        this.#ensureWorker();
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
                reject(new Error('Async database closed'));
            }
            this.pending.clear();
            await worker.terminate();
        }
    }

    async exec(sql) {
        return await this.#call({ method: 'exec', sql });
    }

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

    #ensureWorker() {
        if (this.worker) { return; }
        const worker = new Worker(new URL('./sqlite.mjs', import.meta.url), {
            workerData: {
                dbPath: this.dbPath,
            },
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
                message?.error?.message || 'Async database worker failed'
            );
            if (message?.error?.stack) {
                error.stack = message.error.stack;
            }
            pending.reject(error);
        });
        worker.on('error', (error) => {
            this.#rejectAll(error);
        });
        worker.on('exit', (code) => {
            if (!this.closed && code !== 0) {
                this.#rejectAll(
                    new Error(`Async database worker exited with code ${code}`)
                );
            }
            this.worker = null;
        });
        this.worker = worker;
    }

    #call(payload = {}) {
        if (this.closed) {
            return Promise.reject(new Error('Async database is closed'));
        }
        this.#ensureWorker();
        const id = this.nextRequestId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.worker.postMessage({ ...payload, id });
        });
    }

    #rejectAll(error) {
        for (const { reject } of this.pending.values()) {
            reject(error);
        }
        this.pending.clear();
    }
}

const init = async (options = {}) => {
    if (database) { return database; }
    if (initPromise) { return await initPromise; }
    const { dbPath = ':memory:' } = normalizeOptions(options);
    initPromise = (async () => {
        const db = new AsyncDatabaseSync(dbPath);
        await db.open();
        database = db;
        return database;
    })();
    try {
        return await initPromise;
    } finally {
        initPromise = null;
    }
};

const end = async () => {
    if (!database) { return; }
    const db = database;
    database = null;
    await db.close();
};

const exec = async (sql) => await (await requireDatabase()).exec(sql);
const run = async (sql, params) => await (await requireDatabase()).run(sql, params);
const get = async (sql, params) => await (await requireDatabase()).get(sql, params);
const all = async (sql, params) => await (await requireDatabase()).all(sql, params);
const transaction = async (operations) =>
    await (await requireDatabase()).transaction(operations);

export default init;
export {
    all,
    end,
    exec,
    get,
    init,
    run,
    transaction,
};
