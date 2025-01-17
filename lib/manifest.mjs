const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1998.1.10",
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
        "file-type": "^19.6.0",
        "mathjs": "^14.0.1",
        "uuid": "^11.0.3"
    },
    "devDependencies": {
        "@anthropic-ai/sdk": "^0.33.1",
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/speech": "^6.7.0",
        "@google-cloud/storage": "^7.14.0",
        "@google-cloud/text-to-speech": "^5.7.0",
        "@google-cloud/vision": "^4.3.2",
        "@google/generative-ai": "^0.21.0",
        "@mozilla/readability": "^0.5.0",
        "@ngrok/ngrok": "^1.4.1",
        "@sentry/node": "^8.47.0",
        "@sentry/profiling-node": "^8.47.0",
        "acme-client": "^5.4.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.3",
        "form-data": "^4.0.1",
        "ioredis": "^5.4.2",
        "js-tiktoken": "^1.0.16",
        "jsdom": "^25.0.1",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^10.3.0",
        "mailparser": "^3.7.2",
        "mime": "^4.0.6",
        "mysql2": "^3.12.0",
        "node-mailjet": "^6.0.6",
        "node-polyfill-webpack-plugin": "^4.1.0",
        "office-text-extractor": "^3.0.3",
        "ollama": "^0.5.11",
        "openai": "^4.77.0",
        "pdfjs-dist": "^4.9.155",
        "pg": "^8.13.1",
        "pgvector": "^0.2.0",
        "ping": "^0.4.4",
        "process": "^0.11.10",
        "puppeteer": "^23.11.1",
        "say": "^0.16.0",
        "telegraf": "^4.16.3",
        "telesignsdk": "^3.0.1",
        "tesseract.js": "^5.1.1",
        "twilio": "^5.4.0",
        "url": "github:Leask/node-url",
        "webpack-cli": "^6.0.1",
        "whisper-node": "^1.1.1",
        "wrangler": "^3.99.0",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.2.1"
    }
};

export default manifest;