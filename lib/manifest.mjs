const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "2001.1.154",
    "private": false,
    "homepage": "https://github.com/Leask/utilitas",
    "main": "index.mjs",
    "type": "module",
    "engines": {
        "node": ">=22.5.0"
    },
    "author": "Leask Wong <i@leaskh.com>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/Leask/utilitas.git"
    },
    "overrides": {
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz"
    },
    "dependencies": {
        "file-type": "^22.0.1",
        "mathjs": "^15.2.0",
        "uuid": "^14.0.0"
    },
    "devDependencies": {
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/discoveryengine": "^2.7.0",
        "@google-cloud/storage": "^7.19.0",
        "@google/genai": "^2.3.0",
        "@mozilla/readability": "github:mozilla/readability",
        "@sentry/node": "^10.53.1",
        "@sentry/profiling-node": "^10.53.1",
        "acme-client": "^5.4.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fake-indexeddb": "^6.2.5",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.3",
        "form-data": "^4.0.5",
        "google-gax": "^5.0.6",
        "ioredis": "^5.10.1",
        "jsdom": "^29.1.1",
        "lorem-ipsum": "^3.0.0",
        "mailgun.js": "^13.0.1",
        "mailparser": "^3.9.8",
        "mime": "^4.1.0",
        "mysql2": "^3.22.3",
        "node-mailjet": "^6.0.11",
        "node-polyfill-webpack-plugin": "^4.1.0",
        "office-text-extractor": "^4.0.0",
        "openai": "^6.37.0",
        "pdf-lib": "^1.17.1",
        "pdfjs-dist": "^5.7.284",
        "pg": "^8.20.0",
        "pgvector": "^0.2.1",
        "ping": "^1.0.0",
        "process": "^0.11.10",
        "puppeteer": "^25.0.2",
        "say": "^0.16.0",
        "telegraf": "npm:@leask/telegraf@6.0.1",
        "telesignsdk": "^5.0.0",
        "tesseract.js": "^7.0.0",
        "twilio": "^6.0.2",
        "url": "github:Leask/node-url",
        "webpack-cli": "^7.0.2",
        "whisper-node": "^1.1.1",
        "wrangler": "^4.92.0",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.3.1"
    }
};

export default manifest;