'use strict';

const ping = async (host, options = { timeout: 3 }) => {
    return await libPing.promise.probe(host, options);
};

const pickFastestHost = async (hosts, options = {}) => {
    let [reqHosts, pingResp, pasResp, result] = [hosts || [], [], [], null];
    reqHosts.map(x => {
        try { x = new URL(x).hostname; } catch (e) { }
        pingResp.push(ping(x));
    });
    pingResp = await Promise.all(pingResp);
    pingResp.map(x => {
        if (x.alive) { pasResp.push(x); }
        if (options.debug) {
            let log = [];
            for (let i in x) {
                if (!['output', 'times', 'stddev'].includes(i)) {
                    log.push(`${i}: ${x[i]}`);
                }
            }
            utilitas.modLog(`ping > ${log.join(', ')}`, __filename);
        }
    });
    if (pingResp.length) {
        pasResp.sort((x, y) => {
            return Number(x.packetLoss) - Number(y.packetLoss)
                || Number(x.avg) - Number(y.avg);
        });
        for (let x of reqHosts) {
            if (x.includes(pasResp[0].host)) { result = x; break; }
        }
    }
    utilitas.assert(result, 'All hosts cannot be connected.', 500);
    return result;
};

module.exports = {
    pickFastestHost,
    ping,
};

const utilitas = require('./utilitas');
const libPing = require('ping');
