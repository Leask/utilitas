import { assertExist, exec } from './shell.mjs';
import { ensureArray, log as _log, need, throwError } from './utilitas.mjs';
import { getCurrentIp } from './web.mjs';

const _NEED = ['fast-geoip', 'ping'];
const isLocalhost = host => ['127.0.0.1', '::1', 'localhost'].includes(host);
const log = content => _log(content, import.meta.url);

const ping = async (host, options = { timeout: 3, min_reply: 3 }) => {
    await assertExist('ping')
    return await (await need('ping')).promise.probe(host, options);
};

const pickFastestHost = async (hosts, options = {}) => {
    let [reqHosts, pingResp, pasResp, result]
        = [ensureArray(hosts), [], [], null];
    reqHosts.map(x => {
        try { x = new URL(x).hostname; } catch (e) { }
        pingResp.push(ping(x));
    });
    pingResp = await Promise.all(pingResp);
    pingResp.map(x => {
        if (x.alive) { pasResp.push(x); }
        if (options.debug) {
            let logs = [];
            for (let i in x) {
                if (!['output', 'times', 'stddev'].includes(i)) {
                    logs.push(`${i}: ${x[i]}`);
                }
            }
            log(`ping > ${logs.join(', ')}`);
        }
    });
    if (pingResp.length && pasResp.length) {
        pasResp.sort((x, y) => {
            return Number(x.packetLoss) - Number(y.packetLoss)
                || Number(x.avg) - Number(y.avg);
        });
        for (let x of reqHosts) {
            if (x.includes(pasResp[0].host)) { result = x; break; }
        }
    }
    if (!result) {
        if (options.forcePick) { result = reqHosts[0]; }
        else { throwError('All hosts cannot be connected.', 500); }
    }
    if (options.debug) { log(`picked > ${result}`); }
    return result;
};

const httping = async (url, options = { timeout: 3 }) => { // @todo: timeout
    let [response, error, stTime] = [null, null, new Date()];
    try { response = await fetch(url); } catch (e) { error = e; }
    return {
        url, response, error, response_time: error ? null : new Date() - stTime
    };
};

const pickFastestHttpServer = async (urls, options = {}) => {
    urls = ensureArray(urls);
    const resp = await Promise.all(urls.map(u => httping(u)));
    const result = [];
    resp.map(x => {
        try { delete r.response; } catch (e) { }
        let logs = [];
        if (options.debug) {
            for (let i in x) {
                if (!['error', 'response'].includes(i)) {
                    logs.push(`${i}: ${x[i]}`);
                }
            }
            log(`httping > ${logs.join(', ')}`);
        }
        if (!x.error) { result.push(x); }
    });
    result.sort((x, y) => { return x.response_time - y.response_time; });
    let pick = result.length ? result[0].url : null;
    if (!pick) {
        if (options.forcePick) { pick = urls[0]; }
        else { throwError('All hosts cannot be connected.', 500); }
    }
    if (options.debug) { log(`picked > ${pick}`); }
    return pick;
};

const getCurrentPosition = async () => {
    const ip = await getCurrentIp();
    assert(ip, 'Network is unreachable.', 500);
    const loc = await (await need('fast-geoip', { raw: true })).lookup(ip);
    assert(loc, 'Error detecting geolocation.', 500);
    return Object.assign(loc, { ip });
};

const cfTunnel = async (token, options = {}) => {
    const bin = options?.bin || 'cloudflared';
    await assertExist(bin);
    assert(token, 'Token is required.', 401);
    const cmd = [bin, 'tunnel', 'run', '--token', token];
    return await exec(cmd.join(' '), {
        stream: options?.stream, acceptError: true,
    });
};

export {
    _NEED,
    cfTunnel,
    getCurrentPosition,
    httping,
    isLocalhost,
    pickFastestHost,
    pickFastestHttpServer,
    ping,
};
