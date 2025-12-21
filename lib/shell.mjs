import { exec as _exec } from 'child_process';
import { log as _log } from './utilitas.mjs';

const log = (content) => _log(content, import.meta.url);
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };
const assertCommand = (command) => assert(command, 'Command is required.', 500);
const exist = (bin) => { assertCommand(bin); return which(bin); };

const exec = async (command, options = {}) => {
    assertCommand(command);
    return new Promise((resolve, reject) => {
        const child = (_exec || vF)(command, (error, stdout, stderr) => {
            if (error && !options?.acceptError) { return reject(error); }
            try {
                assert(options?.acceptError || !stderr, stderr, 500);
            } catch (e) {
                return reject(e);
            }
            resolve(options?.acceptError
                ? [stdout, stderr].map(x => x.trim()).filter(x => x).join('\n')
                : stdout.trim());
        });
        if (options?.stream && child?.stdout) {
            child.stdout.on('data', options.stream);
            child.stderr.on('data', options.stream);
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
