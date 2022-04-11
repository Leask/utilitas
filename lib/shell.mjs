import * as utilitas from './utilitas.mjs';
import childProcess from 'child_process';
import util from 'util';
import yargsParser from 'yargs-parser';

const log = (content) => { return utilitas.modLog(content, 'shell'); };
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };
const pmsExec = util.promisify(childProcess && childProcess?.exec || vF);
const parseArgv = (argv) => yargsParser(argv || process.argv.slice(2));
const assertCommand = (command) => assert(command, 'Command is required.', 500);

const exec = async (command, options = {}) => {
    assertCommand(command);
    const { stdout, stderr } = await pmsExec(command);
    assert(!stderr, stderr, 500);
    return stdout;
};

const which = async (bin) => {
    assertCommand(bin);
    let binPath = null;
    try { binPath = await exec(`which ${bin}`); } catch (err) { }
    return binPath;
};

const exist = async (bin) => {
    assertCommand(bin);
    return !!await which(bin);
};

const assertExist = async (bin, er, code = 500) => {
    assertCommand(bin);
    assert(await exist(bin), er || `Command not found: ${bin}.`, code);
};

export default exec;
export {
    assertExist,
    exec,
    exist,
    parseArgv,
    which,
};
