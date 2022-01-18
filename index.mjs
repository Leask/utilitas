import * as fileType from 'file-type';
import * as math from 'mathjs';
import * as uuid from 'uuid';
import base64url from 'base64url';
import cache from './lib/cache.mjs';
import colors from 'colors/safe.js';
import dbio from './lib/dbio.mjs';
import email from './lib/email.mjs';
import encryption from './lib/encryption.mjs';
import event from './lib/event.mjs';
import fetch from 'node-fetch';
import geoIp from 'fast-geoip';
import ini from 'ini';
import jwt from 'jsonwebtoken';
import mailgun from 'mailgun-js';
import mailjet from 'node-mailjet';
import mysql from 'mysql2/promise';
import network from './lib/network.mjs';
import ping from 'ping';
import publicIp from 'public-ip';
import qs from 'qs';
import redis from 'ioredis';
import sentinel from './lib/sentinel.mjs';
import sentry from '@sentry/node';
import shell from './lib/shell.mjs';
import shot from './lib/shot.mjs';
import sms from './lib/sms.mjs';
import storage from './lib/storage.mjs';
import tape from './lib/tape.mjs';
import telesign from 'telesignsdk';
import twilio from 'twilio';
import uoid from './lib/uoid.mjs';
import utilitas from './lib/utilitas.mjs';
import winston from 'winston';
import winstonPapertrail from 'winston-papertrail-mproved';

export default {
    // dependencies
    base64url,
    colors,
    fetch,
    fileType,
    geoIp,
    ini,
    jwt,
    mailgun,
    mailjet,
    math,
    mysql,
    ping,
    publicIp,
    qs,
    redis,
    sentry,
    telesign,
    twilio,
    uuid,
    winston,
    winstonPapertrail,
    // features
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
