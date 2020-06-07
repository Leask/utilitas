'use strict';

const { uuidv4 } = require('uuid');
const utilitas = require('./utilitas');
const path = require('path');
const fs = require('fs');

const jobs = {};

let timer = null;

const log = (content) => {
    return utilitas.modLog(content, __filename);
};

const sToMs = (intSec) => {
    return 1000 * ~~intSec;
};

const tryLock = (name, now, timeout) => {
    return (jobs[name].lock + timeout > now)
        ? jobs[name].lock
        : !(jobs[name].lock = now);
};

const unLock = (name) => {
    return jobs[name].lock = 0;
};

const exec = async () => {
    const now = new Date().getTime();
    for (let i in jobs) {
        if (jobs[i].lastRun + jobs[i].interval < now) {
            jobs[i].lastRun = now;
            try {
                if (tryLock(i, now, jobs[i].timeout)) {
                    // log(`${i} is locked, skipping.`);
                    continue;
                }
                // console.log(`EVENT RUN: ${i}`);
                await jobs[i].function();
            } catch (err) {
                log(err);
            }
            // console.log(`EVENT END: ${i}`);
            unLock(i);
        }
    }
};

const loop = async (func, interval, tout, delay, name) => {
    await utilitas.timeout((delay = sToMs(delay)));
    jobs[(name = name || uuidv4())] = {
        function: func,
        interval: sToMs(interval),
        timeout: sToMs(tout),
        delay: delay,
        lastRun: 0,
        lock: 0,
    };
    return (timer = timer
        || log('initialized!')
        || (timer = setInterval(exec, 1000 * 1)));
};

const list = () => {
    return jobs;
};

const load = async (module) => {
    utilitas.assert(module && module.func, 'Event function is required.', 500);
    return await loop(
        module.func, module.interval, module.tout, module.delay, module.name
    );
};

const bulk = async (absDir) => {
    const result = [];
    for (let file of fs.readdirSync(absDir) || []) {
        if (/\.js$/i.test(file) && file.toLowerCase() !== 'index.js') {
            const filename = file.replace(/^(.*)\.js$/i, '$1');
            const mod = require(path.join(absDir, file));
            if (mod.run) {
                mod.name = mod.name || filename;
                result.push(await load(mod));
            }
        }
    }
    return result;
};

module.exports = {
    bulk,
    list,
    load,
    loop,
};
