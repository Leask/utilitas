const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1999.1.90",
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
    "overrides": {
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz"
    },
    "dependencies": {
        "file-type": "^21.0.0",
        "mathjs": "^14.6.0",
        "uuid": "^11.1.0"
    },
    "devDependencies": {
        "@anthropic-ai/sdk": "^0.60.0",
        "@anthropic-ai/vertex-sdk": "^0.13.1",
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/speech": "^7.2.0",
        "@google-cloud/storage": "^7.17.0",
        "@google-cloud/vision": "^5.3.3",
        "@google/genai": "^1.16.0",
        "@mozilla/readability": "github:mozilla/readability",
        "@sentry/node": "^10.7.0",
        "@sentry/profiling-node": "^10.7.0",
        "acme-client": "^5.4.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.3",
        "form-data": "^4.0.4",
        "ioredis": "^5.7.0",
        "js-tiktoken": "^1.0.21",
        "jsdom": "^26.1.0",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^12.0.3",
        "mailparser": "^3.7.4",
        "mime": "^4.0.7",
        "mysql2": "^3.14.3",
        "node-mailjet": "^6.0.9",
        "node-polyfill-webpack-plugin": "^4.1.0",
        "office-text-extractor": "^3.0.3",
        "openai": "^5.16.0",
        "pdfjs-dist": "^5.4.54",
        "pg": "^8.16.3",
        "pgvector": "^0.2.1",
        "ping": "^0.4.4",
        "process": "^0.11.10",
        "puppeteer": "^24.17.1",
        "say": "^0.16.0",
        "telegraf": "^4.16.3",
        "telesignsdk": "^3.0.4",
        "tesseract.js": "^6.0.1",
        "twilio": "^5.8.2",
        "url": "github:Leask/node-url",
        "webpack-cli": "^6.0.1",
        "whisper-node": "^1.1.1",
        "wrangler": "^4.33.1",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.2.1"
    }
};

export default manifest;