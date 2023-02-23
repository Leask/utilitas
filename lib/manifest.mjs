const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1991.1.32",
    "private": false,
    "homepage": "https://github.com/Leask/utilitas",
    "main": "index.mjs",
    "type": "module",
    "engines": {
        "node": ">=18.x"
    },
    "author": "Leask Wong <i@leaskh.com>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/Leask/utilitas.git"
    },
    "dependencies": {
        "@sentry/node": "^7.37.1",
        "base64url": "^3.0.1",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "file-type": "^18.2.0",
        "form-data": "^4.0.0",
        "ini": "github:Leask/ini",
        "ioredis": "^5.3.0",
        "jsonwebtoken": "^9.0.0",
        "luxon": "^3.2.1",
        "mailgun.js": "^8.0.6",
        "mathjs": "^11.5.1",
        "mysql2": "^3.1.2",
        "node-mailjet": "^6.0.2",
        "nopt": "^7.0.0",
        "ping": "^0.4.2",
        "portfinder": "^1.0.32",
        "qrcode": "^1.5.1",
        "tail": "^2.2.6",
        "telegraf": "^4.11.2",
        "telesignsdk": "^2.2.3",
        "twilio": "^4.7.2",
        "uuid": "^9.0.0"
    },
    "devDependencies": {
        "browserify-fs": "^1.0.0",
        "node-polyfill-webpack-plugin": "^2.0.1",
        "webpack-cli": "^5.0.1"
    }
};

export default manifest;