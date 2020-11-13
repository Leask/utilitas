'use strict';

const path = require('path');
const fs = require('fs');

const libPath = path.join(__dirname, 'lib');

module.exports = {
    base64url: require('base64url'),
    colors: require('colors/safe'),
    fetch: require('node-fetch'),
    jwt: require('jsonwebtoken'),
    mailgun: require('mailgun-js'),
    mailjet: require('node-mailjet'),
    math: require('mathjs'),
    mysql: require('mysql2/promise'),
    ping: require('ping'),
    qs: require('qs'),
    redis: require('ioredis'),
    sentry = require('@sentry/node'),
    telesign: require('telesignsdk'),
    twilio: require('twilio'),
    uuid: require('uuid'),
};

fs.readdirSync(libPath).filter((file) => {
    return /\.js$/i.test(file) && file.indexOf('.') !== 0;
}).forEach((file) => {
    module.exports[file.replace(/^(.*)\.js$/, '$1')]
        = require(path.join(libPath, file));
});
