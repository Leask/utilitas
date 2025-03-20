const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1999.1.31",
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
        "file-type": "^20.4.1",
        "mathjs": "^14.3.1",
        "uuid": "^11.1.0"
    },
    "devDependencies": {
        "@anthropic-ai/sdk": "^0.39.0",
        "@anthropic-ai/vertex-sdk": "^0.7.0",
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/speech": "^7.0.0",
        "@google-cloud/storage": "^7.15.2",
        "@google-cloud/text-to-speech": "^6.0.0",
        "@google-cloud/vision": "^5.0.0",
        "@google/genai": "^0.4.0",
        "@mozilla/readability": "github:mozilla/readability",
        "@sentry/node": "^9.6.0",
        "@sentry/profiling-node": "^9.6.0",
        "acme-client": "^5.4.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.3",
        "form-data": "^4.0.2",
        "ioredis": "^5.6.0",
        "js-tiktoken": "^1.0.19",
        "jsdom": "^26.0.0",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^12.0.1",
        "mailparser": "^3.7.2",
        "mime": "^4.0.6",
        "mysql2": "^3.13.0",
        "node-mailjet": "^6.0.8",
        "node-polyfill-webpack-plugin": "^4.1.0",
        "office-text-extractor": "^3.0.3",
        "openai": "^4.87.4",
        "pdfjs-dist": "^5.0.375",
        "pg": "^8.14.1",
        "pgvector": "^0.2.0",
        "ping": "^0.4.4",
        "process": "^0.11.10",
        "puppeteer": "^24.4.0",
        "say": "^0.16.0",
        "telegraf": "^4.16.3",
        "telesignsdk": "^3.0.2",
        "tesseract.js": "^6.0.0",
        "twilio": "^5.5.0",
        "url": "github:Leask/node-url",
        "webpack-cli": "^6.0.1",
        "whisper-node": "^1.1.1",
        "wrangler": "^4.1.0",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.2.1"
    }
};

export default manifest;