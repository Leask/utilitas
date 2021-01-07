'use strict';

const jobs = {};

let timer = null;

const sToMs = (intSec) => { return 1000 * ~~intSec; };

const unLock = (name) => { return jobs[name].lock = 0; };

const list = () => { return jobs; };

const log = (content, job, options) => {
    options = Object.assign({ time: true }, options || {});
    if (!job || !jobs[job] || !jobs[job].silent || content instanceof Error) {
        utilitas.modLog(
            content, utilitas.basename(__filename) + (job ? ` > ${job}` : ''),
            options
        );
    }
};

const tryLock = (name, now, timeout) => {
    return (jobs[name].lock + timeout > now)
        ? jobs[name].lock
        : !(jobs[name].lock = now);
};

const exec = async () => {
    const now = Date.now();
    for (let i in jobs) {
        if (jobs[i].lastRun + jobs[i].interval < now) {
            jobs[i].lastRun = now;
            try {
                if (tryLock(i, now, jobs[i].timeout)) {
                    log('Locked, skipped.', i);
                    continue;
                }
                log('Emit...', i);
                await jobs[i].function();
            } catch (err) {
                log(err, i);
            }
            log('Done.', i);
            unLock(i);
        }
    }
};

const loop = async (func, interval, tout, delay, name, options = {}) => {
    await utilitas.timeout((delay = sToMs(delay)));
    jobs[(name = name || uuidv4())] = {
        function: func,
        interval: sToMs(interval),
        timeout: sToMs(tout),
        delay: delay,
        lastRun: 0,
        lock: 0,
        silent: !!options.silent,
        end: options.end,
    };
    return (timer = timer || log('Initialized.', name)
        || (timer = setInterval(exec, 1000 * 1)));
};

const load = async (module, options = {}) => {
    utilitas.assert(module && module.func, 'Event function is required.', 500);
    return await loop(
        module.func, module.interval, module.tout, module.delay, module.name,
        options
    );
};

const bulk = async (absDir, options) => {
    options = options || {};
    const pms = [];
    log(`SERVICES: ${absDir}`, null, options);
    (fs.readdirSync(absDir) || []).filter((file) => {
        return /\.js$/i.test(file) && file.indexOf('.') !== 0;
    }).forEach((file) => {
        const filename = file.replace(/^(.*)\.js$/i, '$1');
        const mod = require(path.join(absDir, file));
        if (mod.run) {
            mod.name = mod.name || filename;
            pms.push(load(mod, options));
        }
    });
    return await Promise.all(pms);
};

const end = async () => {
    clearInterval(timer);
    timer = -1;
    const now = Date.now();
    for (let i in jobs) {
        if (jobs[i].end) { try { await jobs[i].end(); } catch (e) { }; }
        while (tryLock(i, now, jobs[i].timeout)) {
            log('Waiting...', i); await utilitas.timeout(1000);
        }
        log('End.', i);
    }
    log('Terminated.');
};

module.exports = {
    bulk,
    list,
    load,
    loop,
    end,
};

const utilitas = require('./utilitas');
const uuidv4 = require('uuid').v4;
const path = require('path');
const fs = require('fs');
