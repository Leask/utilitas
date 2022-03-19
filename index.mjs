// dependencies
import { default as colors } from 'colors/safe.js';
import { default as fetch } from 'node-fetch';
import { Tail as tail } from 'tail';
import * as base64url from 'base64url';
import * as fileType from 'file-type';
import * as geoIp from 'fast-geoip';
import * as ini from 'ini';
import * as jwt from 'jsonwebtoken';
import * as mailgun from 'mailgun-js';
import * as mailjet from 'node-mailjet';
import * as math from 'mathjs';
import * as mysql from 'mysql2/promise';
import * as ping from 'ping';
import * as qs from 'qs';
import * as redis from 'ioredis';
import * as sentry from '@sentry/node';
import * as telegraf from 'telegraf';
import * as telesign from 'telesignsdk';
import * as twilio from 'twilio';
import * as uuid from 'uuid';
// features
import * as bot from './lib/bot.mjs';
import * as cache from './lib/cache.mjs';
import * as dbio from './lib/dbio.mjs';
import * as email from './lib/email.mjs';
import * as encryption from './lib/encryption.mjs';
import * as event from './lib/event.mjs';
import * as network from './lib/network.mjs';
import * as sentinel from './lib/sentinel.mjs';
import * as shell from './lib/shell.mjs';
import * as shot from './lib/shot.mjs';
import * as sms from './lib/sms.mjs';
import * as storage from './lib/storage.mjs';
import * as tape from './lib/tape.mjs';
import * as uoid from './lib/uoid.mjs';
import * as utilitas from './lib/utilitas.mjs';

// Export
export * as default from './lib/utilitas.mjs';
export {
    // dependencies
    colors,
    fetch,
    tail,
    base64url,
    fileType,
    geoIp,
    ini,
    jwt,
    mailgun,
    mailjet,
    math,
    mysql,
    ping,
    qs,
    redis,
    sentry,
    telegraf,
    telesign,
    twilio,
    uuid,
    // features
    bot,
    cache,
    dbio,
    email,
    encryption,
    event,
    network,
    sentinel,
    shell,
    shot,
    sms,
    storage,
    tape,
    uoid,
    utilitas,
};

// Browser
let runningInBrowser = false;
try { runningInBrowser = !!window; } catch (e) { }
// import * as package from './package.json';
// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
const pack = {
    ...await storage.readJson('./package.json'),
    runningInBrowser,
};
if (runningInBrowser) {
    window._utilitas = pack;
    window.utilitas = {
        // dependencies
        colors,
        fetch,
        tail,
        base64url,
        fileType,
        geoIp,
        ini,
        jwt,
        mailgun,
        mailjet,
        math,
        mysql,
        ping,
        qs,
        redis,
        sentry,
        telegraf,
        telesign,
        twilio,
        uuid,
        // features
        bot,
        cache,
        dbio,
        email,
        encryption,
        event,
        network,
        sentinel,
        shell,
        shot,
        sms,
        storage,
        tape,
        uoid,
        utilitas,
    };
    console.log('[UTILITAS](https://github.com/Leask/utilitas) is ready!');
} else { global._utilitas = pack; }
