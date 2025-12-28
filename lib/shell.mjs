import { spawn } from 'child_process';
import { log as _log } from './utilitas.mjs';

const log = (content) => _log(content, import.meta.url);
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };
const assertCommand = (command) => assert(command, 'Command is required.', 500);
const exist = (bin) => { assertCommand(bin); return which(bin); };

const exec = async (command, options = {}) => {
    assertCommand(command);
    const limit = options?.limit || 3000;
    return new Promise((resolve, reject) => {
        const child = (spawn || vF)(command, { ...options || {}, shell: true });
        const buf = { stdout: { lines: [], p: '' }, stderr: { lines: [], p: '' } };
        const collect = (k, d) => {
            if (options?.stream) { options.stream(options?.raw ? d : d.toString().trim()); }
            const p = (buf[k].p + d).split(/\r?\n/);
            buf[k].p = p.pop();
            buf[k].lines = buf[k].lines.concat(p);
            if (buf[k].lines.length > limit) {
                buf[k].lines = buf[k].lines.slice(-limit);
            }
        };
        const getBuf = (k) => {
            const c = buf[k].lines.join('\n');
            return c + (c && buf[k].p ? '\n' : '') + buf[k].p;
        };
        if (child?.stdout) {
            child.stdout.on('data', d => collect('stdout', d));
            child.stderr.on('data', d => collect('stderr', d));
            child.on('close', code => {
                const stdout = getBuf('stdout');
                const stderr = getBuf('stderr');
                if (code && !options?.acceptError) {
                    const err = new Error(stderr || `Command failed: ${command}\n${stdout}`);
                    err.code = code;
                    return reject(err);
                }
                try {
                    assert(options?.acceptError || !stderr, stderr, 500);
                } catch (e) { return reject(e); }
                resolve(options?.acceptError
                    ? [stdout, stderr].map(x => x.trim()).filter(x => x).join('\n')
                    : stdout.trim());
            });
            child.on('error', reject);
        } else {
            vF(command, resolve);
        }
    });
};

const which = async (bin) => {
    assertCommand(bin);
    let binPath = null;
    try { binPath = await exec(`which ${bin}`); } catch (err) { }
    return binPath;
};

const assertExist = async (bin, er, code = 500) => {
    assertCommand(bin);
    assert(await exist(bin), er || `Command not found: ${bin}.`, code);
};

export default exec;
export { assertExist, exec, exist, which };
