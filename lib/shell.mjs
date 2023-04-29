import { exec as _exec, spawn } from 'child_process';
import { log as _log } from './utilitas.mjs';
import { promisify } from 'util';

// const _NEED = ['node-pty'];
const log = (content) => _log(content, import.meta.url);
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };
const pmsExec = promisify(_exec || vF);
const assertCommand = (command) => assert(command, 'Command is required.', 500);
const exist = (bin) => { assertCommand(bin); return which(bin); };

const exec = async (command, options = {}) => {
    assertCommand(command);
    const { stdout, stderr } = await pmsExec(command);
    assert(!stderr, stderr, 500);
    return stdout;
};

const exec2 = async (command, options = {}) => {
    // const ls = spawn('sh', ['/Users/leask/Documents/utilitas/text.sh']); //['-lh', '/']

    const os = await import('os');
    const pty = await import('node-pty');

    var shell = os.platform() === 'win32' ? 'powershell.exe' : 'sh';

    var ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.onData((data) => {
        process.stdout.write(data);
    });

    ptyProcess.write('ls\r');
    ptyProcess.resize(100, 40);
    ptyProcess.write('ls\r');

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
export { assertExist, exec, exist, exec2, which };
