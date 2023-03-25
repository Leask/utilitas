// @todo by @Leask: need to foollow up on this:
// https://github.com/publishlab/node-acme-client/blob/HEAD/docs/upgrade-v5.md

import { __, basename, insensitiveCompare, log as _log, } from './utilitas.mjs';
import { boardcast, on } from './callosum.mjs';
import { Client, directory, forge } from 'acme-client';
import { getConfig, readFile, setConfig } from './storage.mjs'
import { join } from 'path';
import { loop } from './event.mjs';

const [HTTP01, termsOfServiceAgreed, curCert] = ['http-01', true, {}];
const assertDomain = domain => assert(domain, 'Invalid fomain.', 400);
const assertChlnge = t => assert(t === HTTP01, 'Only HTTP-auth is supported.');
const getPathByToken = token => `/.well-known/acme-challenge/${token}`;
const log = content => _log(content, import.meta.url);
const resetCurCert = () => Object.assign(curCert, { key: null, cert: null });
const __keys = __(import.meta.url, '../keys');
const SSL_RESET = 'SSL_RESET';

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

const _getCert = async (name, force) => {
    force || assertDomain(name);
    const { csr, key, cert, domain } = (await getConfig())?.config || {};
    return (force ? true : insensitiveCompare(domain, name))
        ? { csr, key, cert, domain } : null;
};

const createCsr = async (commonName) => {
    assertDomain(commonName);
    const [key, csr] = await forge.createCsr({ commonName });
    return { key: key.toString(), csr: csr.toString() };
};

const ensureCert = async (domain, challengeCreate, challengeRemove, option) => {

    const challengeCreateFn = async (authz, challenge, keyAuthorization) => {
        assertChlnge(challenge.type);
        await challengeCreate(getPathByToken(challenge.token), keyAuthorization);
    };

    const challengeRemoveFn = async (authz, challenge, keyAuthorization) => {
        assertChlnge(challenge.type);
        await challengeRemove(getPathByToken(challenge.token));
    };

    let { csr, key, cert } = (await _getCert(domain)) || {};
    if (csr && key) { log('Found private-key and CSR.'); } else {
        log('Creating new private-key and CSR...');
        const newCsr = await createCsr(domain);
        await setConfig({ csr, key, cert: cert = null, domain });
        resetCurCert(); boardcast(SSL_RESET);
        csr = newCsr.csr; key = newCsr.key; log('Done.');
    }
    if (cert) {
        log('Found certificate.');
        const curCrt = await forge.readCertificateInfo(cert);
        if (curCrt.notAfter.getTime() - 1000 * 60 * 60 * 24 * 30 < Date.now()) {
            cert = null; log('Certificate will expire soon.');
        }
    }
    if (!cert) {
        log('Updating certificate...');
        const client = new Client({
            directoryUrl: directory.letsencrypt[
                option?.debug ? 'staging' : 'production'
            ], accountKey: await forge.createPrivateKey(),
        });
        cert = await client.auto({
            csr, email: `i@${domain}`, termsOfServiceAgreed,
            challengePriority: [HTTP01], challengeCreateFn, challengeRemoveFn
        });
        assert(cert, 'Failed to update certificate.', 500);
        await setConfig({ csr, key, cert: cert = cert.toString(), domain });
        resetCurCert(); boardcast(SSL_RESET);
        log('Done.');
    }
    return { csr, key, cert, domain };
};

const init = async (domain, challengeCreate, challengeRemove, options) => {


    import http from 'http';

    const domain = 'test-01.leaskh.com'
    const address = '';
    const debug = true;

    const acmeChallenge = { url: null, key: null };
    const [GET, HTTP_PORT, HTTP, HTTPS] = ['GET', 80, 'http', 'https'];
    const isLocalhost = host => ['127.0.0.1', '::1', 'localhost'].includes(host);


    const request = async (req, res) => {
        if (req.method === GET && acmeChallenge.key
            && acmeChallenge.url && acmeChallenge.url === req.url) {
            return res.end(acmeChallenge.key);
        }
        res.writeHead(301, { Location: `${HTTPS}://${domain}${req.url}` }).end();
    };

    const getAddress = (ptcl, server) => {
        const { address, family, port } = server.address();
        const add = `${ptcl}://${domain}:${port} (${family} ${address})`;
        return { address, family, port, add };
    };

    globalThis.httpd = http.createServer(request);
    httpd.listen(HTTP_PORT, address, async () => {
        const { add } = getAddress(HTTP, httpd);
        console.log(`HTTP Server started at ${add}.`);
    });

    if (isLocalhost(domain)) {
        warning('A public domain is required to get an ACME certs.');
    } else {
        await ssl.init(domain,
            async (url, key) => Object.assign(acmeChallenge, { url, key }),
            async (url) => Object.assign(acmeChallenge, { url: '', key: '' }),
            { debug: debug }
        );
    }



    await loop(
        () => ensureCert( // https://letsencrypt.org/docs/rate-limits/
            domain, challengeCreate, challengeRemove, options
        ), 60 * 60 * 24 * 7, 60 * 10, 0, basename(import.meta.url),
        { silent: true }
    );



};





















// @todo: debug!? can this trigger?
on(SSL_RESET, resetCurCert);

export default init;
export { createCsr, ensureCert, getCert, init };
