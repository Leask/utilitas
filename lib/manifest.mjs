const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1995.2.80",
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
        "mathjs": "^12.3.0",
        "uuid": "^9.0.1"
    },
    "devDependencies": {
        "@ffmpeg-installer/ffmpeg": "^1.1.0",
        "@ffprobe-installer/ffprobe": "^2.1.2",
        "@google-cloud/aiplatform": "^3.10.1",
        "@google-cloud/speech": "^6.1.1",
        "@google-cloud/storage": "^7.7.0",
        "@google-cloud/text-to-speech": "^5.0.2",
        "@google-cloud/vertexai": "^0.2.1",
        "@google-cloud/vision": "^4.0.3",
        "@google/generative-ai": "^0.1.3",
        "@mozilla/readability": "^0.5.0",
        "@ngrok/ngrok": "^0.9.1",
        "@sentry/node": "^7.98.0",
        "acme-client": "^5.2.0",
        "browserify-fs": "^1.0.0",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.88",
        "fluent-ffmpeg": "^2.1.2",
        "form-data": "^4.0.0",
        "ioredis": "^5.3.2",
        "js-tiktoken": "^1.0.8",
        "jsdom": "^24.0.0",
        "lorem-ipsum": "^2.0.8",
        "mailgun.js": "^10.0.0",
        "mailparser": "^3.6.6",
        "mime-types": "^2.1.35",
        "mysql2": "^3.9.0",
        "node-mailjet": "^6.0.5",
        "node-polyfill-webpack-plugin": "^3.0.0",
        "office-text-extractor": "^3.0.2",
        "ollama": "^0.4.3",
        "openai": "^4.26.0",
        "pdfjs-dist": "^4.0.379",
        "pg": "^8.11.3",
        "pgvector": "^0.1.7",
        "ping": "^0.4.4",
        "say": "^0.16.0",
        "telegraf": "^4.15.3",
        "telesignsdk": "^2.2.3",
        "tesseract.js": "^5.0.4",
        "twilio": "^4.21.0",
        "url": "github:Leask/node-url",
        "webpack-cli": "^5.1.4",
        "whisper-node": "^1.1.1",
        "wrangler": "^3.25.0",
        "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.1/xlsx-0.20.1.tgz",
        "youtube-transcript": "^1.0.6"
    }
};

export default manifest;