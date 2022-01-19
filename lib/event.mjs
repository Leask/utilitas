import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import utilitas from './utilitas.mjs';

const __filename = fileURLToPath(import.meta.url);
const jobs = {};
const sToMs = (sec) => { return 1000 * (isNaN(sec = Number(sec)) ? 0 : sec); };
const unLock = (name) => { return jobs[name].lock = 0; };
const list = () => { return jobs; };

let timer = null;

const log = (content, job, options) => {
    options = Object.assign({ time: true }, options || {});
    if (!job || !jobs[job] || !jobs[job].silent
        || options.force || content instanceof Error) {
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
                    log('Locked, skipped.', i); continue;
                }
                log('Emit...', i);
                await jobs[i].function();
            } catch (err) { log(err, i); }
            log('Done.', i);
            unLock(i);
        }
    }
};

const loop = async (func, interval, tout, delay, name, options = {}) => {
    timer = timer || log('Initialized.') || setInterval(exec, 1000 * 1);
    log('Scheduled.', name, { force: true });
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
    return timer;
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
    log(`SERVICES: ${absDir}`);
    const [files, pmsRun] = [(fs.readdirSync(absDir) || []).filter(
        file => /\.mjs$/i.test(file) && !file.startsWith('.')
    ), []];
    for (let file of files) {
        const mod = (await import(path.join(absDir, file))).default;
        if (!mod.run) { continue; }
        mod.name = mod.name || file.replace(/^(.*)\.mjs$/i, '$1');
        pmsRun.push(load(mod, options));
    }
    return await Promise.all(pmsRun);
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

export default {
    bulk,
    end,
    list,
    load,
    loop,
};
