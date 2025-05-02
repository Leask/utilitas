import { exec as _exec } from 'child_process';
import { log as _log } from './utilitas.mjs';
import { promisify } from 'util';

const log = (content) => _log(content, import.meta.url);
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };
const pmsExec = promisify(_exec || vF);
const assertCommand = (command) => assert(command, 'Command is required.', 500);
const exist = (bin) => { assertCommand(bin); return which(bin); };

const exec = async (command, options = {}) => {
    assertCommand(command);
    const { stdout, stderr } = await pmsExec(command);
    assert(options?.acceptError || !stderr, stderr, 500);
    return options?.acceptError
        ? [stdout, stderr].map(x => x.trim()).filter(x => x).join('\n')
        : stdout.trim();
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
export { assertCommand, assertExist, exec, exist, which };
