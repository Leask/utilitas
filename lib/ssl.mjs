// @todo by @Leask: need to foollow up on this:
// https://github.com/publishlab/node-acme-client/blob/HEAD/docs/upgrade-v5.md

import {
    __, basename, ensureString, insensitiveCompare, log as _log, need, toString,
} from './utilitas.mjs';

import {
    getConfig as _getConfig, readFile, setConfig as _setConfig
} from './storage.mjs'

import { boardcast, isPrimary, on } from './callosum.mjs';
import { join } from 'path';
import { loop } from './event.mjs';
import http from 'http';

const _NEED = ['acme-client'];
const __keys = __(import.meta.url, '../keys');
const [acmeChallenge, curCert] = [{ url: null, key: null }, {}];
const assertChlnge = t => assert(t === HTTP01, 'Only HTTP-auth is supported.');
const getPathByToken = token => `/.well-known/acme-challenge/${token}`;
const isLocalhost = host => ['127.0.0.1', '::1', 'localhost'].includes(host);
const log = content => _log(content, import.meta.url);
const resetCurCert = () => Object.assign(curCert, { key: null, cert: null });
const _challengeCreate = (url, key) => Object.assign(acmeChallenge, { url, key });
const _challengeRemove = url => Object.assign(acmeChallenge, { url: '', key: '' });
const [GET, HTTP_PORT, HTTPS, SSL_RESET, HTTP01, termsOfServiceAgreed]
    = ['GET', 80, 'https', 'SSL_RESET', 'http-01', true];

const assertDomain = domain => {
    domain = ensureString(domain, { case: 'LOW', trim: true });
    assert(domain, 'Invalid fomain.', 400);
    return domain;
};

const getPack = (name, options) => ({
    ...options || {},
    // pack: { name }, // inject pack name to custom storage path
    // @todo, by @Leask: need to support custom storage function
});

const getConfig = async (domain, options) => (await _getConfig(
    getPack(domain, options)
)).config;

const setConfig = async (domain, data, options) => (await _setConfig(
    { ...data || {}, domain }, getPack(domain, options)
)).config;

const _getCert = async (name, force) => {
    force || (name = assertDomain(name));
    const { csr, key, cert, domain } = await getConfig(name);
    return (force ? true : insensitiveCompare(domain, name))
        ? { csr, key, cert, domain } : null;
};

const getCert = async () => {
    if (curCert.key && curCert.cert) { return curCert; }
    let { key, cert } = (await _getCert(null, true)) || {};
    if (!key || !cert) {
        [key, cert] = await Promise.all([
            readFile(join(__keys, 'private.key')),
            readFile(join(__keys, 'certificate.crt')),
        ]);
    }
    if (key && cert) { return Object.assign(curCert, { key, cert }); }
    return { key, cert };
};

const createCsr = async (commonName, forge) => {
    commonName = assertDomain(commonName);
    const [key, csr] = await forge.createCsr({ commonName });
    return { key: key.toString(), csr: csr.toString() };
};

const packChallengeFunc = fn => async (authz, challenge, keyAuthorization) => {
    assertChlnge(challenge.type);
    return await fn(getPathByToken(challenge.token), keyAuthorization);
};

const ensureCert = async (domain, challengeCreate, challengeRemove, options) => {
    const { Client, directory, forge } = await need('acme-client');
    domain = assertDomain(domain);
    let { csr, key, cert } = (await _getCert(domain)) || {};
    if (csr && key) { log('Found private-key and CSR.'); } else {
        log('Creating new private-key and CSR...');
        const newCsr = await createCsr(domain, forge);
        await setConfig(domain, { csr, key, cert: cert = null });
        resetCurCert(); boardcast(SSL_RESET);
        csr = newCsr.csr; key = newCsr.key; log('Done.');
    }
    if (cert) {
        log('Found certificate.');
        const curCrt = await forge.readCertificateInfo(cert);
        if (curCrt.notAfter.getTime() - Date.now() > 1000 * 60 * 60 * 24 * 30) {
            log(`Certificate is still valid until ${curCrt.notAfter}.`);
        } else { cert = null; log('Certificate will expire soon.'); }
    }
    if (!cert) {
        log('Updating certificate...');
        const client = new Client({
            directoryUrl: directory.letsencrypt[
                options?.debug ? 'staging' : 'production'
            ], accountKey: await forge.createPrivateKey(),
        });
        cert = await client.auto({
            csr, email: `i@${domain}`, termsOfServiceAgreed,
            challengePriority: [HTTP01],
            challengeCreateFn: packChallengeFunc(challengeCreate),
            challengeRemoveFn: packChallengeFunc(challengeRemove),
        });
        assert(cert, 'Failed to update certificate.', 500);
        await setConfig(domain, { csr, key, cert: cert = cert.toString() });
        resetCurCert(); boardcast(SSL_RESET);
        log('Done.');
    }
    return { csr, key, cert, domain };
};

const request = (domain) => async (req, res) =>
    req.method === GET && acmeChallenge.key
        && acmeChallenge.url && acmeChallenge.url === req.url
        ? res.end(acmeChallenge.key)
        : res.writeHead(301, { Location: `${HTTPS}://${domain}${req.url}` }).end();

const init = async (domain, options) => {
    assert(
        (domain = assertDomain(domain)) && !isLocalhost(domain),
        'A public domain is required to get an ACME certs.'
    );
    if (isPrimary) {
        const httpd = http.createServer(request(domain));
        httpd.listen(HTTP_PORT, options?.address || '', () => {
            log(`Challenge HTTP Server started: ${toString(httpd.address())}`);
        }); // https://letsencrypt.org/docs/rate-limits/
        const checkCert = async () => await ensureCert(domain,
            options?.challengeCreate || _challengeCreate,
            options?.challengeRemove || _challengeRemove, options
        );
        if (options.instant) {
            const result = await checkCert();
            await new Promise(resolve => httpd.close(resolve));
            return result;
        }
        const timer = await loop(() =>
            checkCert, 60 * 60 * 24 * 7, 60 * 10, 0,
            basename(import.meta.url), { silent: true }
        );
        return { httpd, timer };
    }
    return on(SSL_RESET, resetCurCert);
};

export default init;
export {
    _NEED,
    createCsr,
    ensureCert,
    getCert,
    init,
    isLocalhost,
};
