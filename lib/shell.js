'use strict';

const log = (content) => { return utilitas.modLog(content, 'shell'); };
const vF = (cmd, cbf) => { log(`Can not run in browser: ${cmd}`); cbf(); };

const assertCommand = (command) => {
    utilitas.assert(command, 'Command is required.', 500);
};

const exec = async (command, options = {}) => {
    assertCommand(command);
    const { stdout, stderr } = await pmsExec(command);
    utilitas.assert(!stderr, stderr, 500);
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
    utilitas.assert(await exist(bin), er || `Command not found: ${bin}.`, code);
};

module.exports = {
    assertExist,
    exec,
    exist,
    which,
};

const childProcess = require('child_process');
const utilitas = require('./utilitas');
const util = require('util');
const pmsExec = util.promisify(childProcess && childProcess?.exec || vF);
