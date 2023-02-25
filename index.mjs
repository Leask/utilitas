// dependencies
import { Tail as tail } from 'tail';
import { Telegraf as telegraf } from 'telegraf';
import * as fileType from 'file-type';
import * as ini from 'ini';
import * as jwt from 'jsonwebtoken';
import * as math from 'mathjs';
import * as mysql from 'mysql2/promise';
import * as ping from 'ping';
import * as redis from 'ioredis';
import * as sentry from '@sentry/node';
import * as telesign from 'telesignsdk';
import * as twilio from 'twilio';
import * as uuid from 'uuid';
import formData from 'form-data';
import geoIp from 'fast-geoip';
import mailgun from 'mailgun.js';
import mailjet from 'node-mailjet';
import nopt from 'nopt';
// features
import _ from './lib/horizon.mjs'
import * as bot from './lib/bot.mjs';
import * as cache from './lib/cache.mjs';
import * as callosum from './lib/callosum.mjs';
import * as dbio from './lib/dbio.mjs';
import * as email from './lib/email.mjs';
import * as encryption from './lib/encryption.mjs';
import * as event from './lib/event.mjs';
import * as network from './lib/network.mjs';
import * as sentinel from './lib/sentinel.mjs';
import * as shekel from './lib/shekel.mjs';
import * as shell from './lib/shell.mjs';
import * as shot from './lib/shot.mjs';
import * as sms from './lib/sms.mjs';
import * as storage from './lib/storage.mjs';
import * as tape from './lib/tape.mjs';
import * as uoid from './lib/uoid.mjs';
import * as utilitas from './lib/utilitas.mjs';
import color from './lib/color.mjs';
import manifest from './lib/manifest.mjs';

// Export
export * as default from './lib/utilitas.mjs';
export {
    // dependencies
    color, fileType, formData, geoIp, ini, jwt, mailgun, mailjet,
    math, mysql, nopt, ping, redis, sentry, tail, telegraf, telesign, twilio,
    uuid,
    // features
    bot, cache, callosum, dbio, email, encryption, event, manifest, network,
    sentinel, shekel, shell, shot, sms, storage, tape, uoid, utilitas,
};

if (utilitas.inBrowser() && !globalThis.utilitas) {
    globalThis.utilitas = {
        color, encryption, event, manifest, math, shekel, shot, storage, uoid,
        utilitas, uuid,
    };
    utilitas.log(
        `(${manifest.homepage}) is ready!`,
        `${(await utilitas.which(manifest)).title}.*`
    );
}
