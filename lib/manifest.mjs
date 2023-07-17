const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1995.0.8",
    "private": false,
    "homepage": "https://github.com/Leask/utilitas",
    "main": "index.mjs",
    "type": "module",
    "engines": {
        "node": ">=20.x"
    },
    "author": "Leask Wong <i@leaskh.com>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/Leask/utilitas.git"
    },
    "dependencies": {
        "file-type": "^18.5.0",
        "mathjs": "^11.8.2",
        "uuid": "^9.0.0"
    },
    "devDependencies": {
        "@google-cloud/speech": "^5.6.0",
        "@google-cloud/text-to-speech": "^4.2.3",
        "@google-cloud/vision": "^3.1.4",
        "@mozilla/readability": "^0.4.4",
        "@sentry/node": "^7.58.0",
        "@waylaidwanderer/chatgpt-api": "^1.37.1",
        "acme-client": "^5.0.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "form-data": "^4.0.0",
        "ioredis": "^5.3.2",
        "jsdom": "^22.1.0",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^9.2.0",
        "mysql2": "^3.5.1",
        "node-mailjet": "^6.0.3",
        "node-polyfill-webpack-plugin": "^2.0.1",
        "office-text-extractor": "^3.0.1",
        "ping": "^0.4.4",
        "telegraf": "^4.12.2",
        "telesignsdk": "^2.2.3",
        "twilio": "^4.13.0",
        "url": "github:Leask/node-url",
        "webpack-cli": "^5.1.4",
        "youtube-transcript": "^1.0.6"
    }
};

export default manifest;