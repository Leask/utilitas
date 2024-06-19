const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1996.1.8",
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
        "file-type": "^19.0.0",
        "mathjs": "^13.0.0",
        "uuid": "^10.0.0"
    },
    "devDependencies": {
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/aiplatform": "^3.23.0",
        "@google-cloud/speech": "^6.6.0",
        "@google-cloud/storage": "^7.11.2",
        "@google-cloud/text-to-speech": "^5.3.0",
        "@google-cloud/vertexai": "^1.2.0",
        "@google-cloud/vision": "^4.3.0",
        "@google/generative-ai": "^0.12.0",
        "@mozilla/readability": "^0.5.0",
        "@ngrok/ngrok": "^1.3.0",
        "@sentry/node": "^8.9.2",
        "@sentry/profiling-node": "^8.9.2",
        "acme-client": "^5.3.1",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.3",
        "form-data": "^4.0.0",
        "ioredis": "^5.4.1",
        "js-tiktoken": "^1.0.12",
        "jsdom": "^24.1.0",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^10.2.1",
        "mailparser": "^3.7.1",
        "mime-types": "^2.1.35",
        "mysql2": "^3.10.1",
        "node-mailjet": "^6.0.5",
        "node-polyfill-webpack-plugin": "^4.0.0",
        "office-text-extractor": "^3.0.3",
        "ollama": "^0.5.2",
        "openai": "^4.51.0",
        "pdfjs-dist": "^4.3.136",
        "pg": "^8.12.0",
        "pgvector": "^0.1.8",
        "ping": "^0.4.4",
        "process": "^0.11.10",
        "say": "^0.16.0",
        "telegraf": "^4.16.3",
        "telesignsdk": "^3.0.0",
        "tesseract.js": "^5.1.0",
        "twilio": "^5.1.1",
        "url": "github:Leask/node-url",
        "webpack-cli": "^5.1.4",
        "whisper-node": "^1.1.1",
        "wrangler": "^3.60.3",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.2.1"
    }
};

export default manifest;