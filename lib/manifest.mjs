const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1992.1.7",
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
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "file-type": "^18.2.0",
        "form-data": "^4.0.0",
        "ioredis": "^5.3.0",
        "mailgun.js": "^8.0.6",
        "mathjs": "^11.5.1",
        "mysql2": "^3.1.2",
        "node-mailjet": "^6.0.2",
        "nopt": "^7.0.0",
        "telegraf": "^4.11.2",
        "telesignsdk": "^2.2.3",
        "twilio": "^4.7.2",
        "uuid": "^9.0.0"
    },
    "devDependencies": {
        "ping": "^0.4.2",
        "browserify-fs": "^1.0.0",
        "node-polyfill-webpack-plugin": "^2.0.1",
        "webpack-cli": "^5.0.1"
    }
};

export default manifest;