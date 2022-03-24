const manifest = {
    "name": "utilitas",
    "description": "Just another common utility for JavaScript.",
    "version": "1989.10.26",
    "private": false,
    "homepage": "https://github.com/Leask/utilitas",
    "main": "index.mjs",
    "type": "module",
    "engines": {
        "node": ">=16.x"
    },
    "scripts": {
        "start": "node index.mjs",
        "debug": "node --inspect --trace-warnings debug.mjs",
        "test": "node --inspect --trace-warnings test.mjs",
        "updep": "npx ncu -u && npm install && wget https://raw.githubusercontent.com/Marak/colors.js/master/lib/styles.js -O ./lib/style.cjs",
        "gitsync": "( git commit -am \"Released @ `date`\" || true ) && git pull && git push",
        "pack": "./node_modules/.bin/webpack-cli --config webpack.config.mjs",
        "build": "npm run updep && ( git commit -am 'update dependencies' || true ) && npm version patch && node build.mjs && npm run pack",
        "prepublishOnly": "npm run build && npm run gitsync",
        "beta": "npm publish --tag beta"
    },
    "author": "Leask Wong <i@leaskh.com>",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/Leask/utilitas.git"
    },
    "dependencies": {
        "@sentry/node": "^6.19.2",
        "base64url": "^3.0.1",
        "buffer": "^6.0.3",
        "fast-geoip": "^1.1.64",
        "file-type": "^17.1.1",
        "form-data": "^4.0.0",
        "ini": "github:Leask/ini",
        "ioredis": "^4.28.5",
        "jsonwebtoken": "^8.5.1",
        "mailgun.js": "^5.0.3",
        "mathjs": "^10.4.1",
        "mysql2": "^2.3.3",
        "node-fetch": "^3.2.3",
        "node-mailjet": "^3.3.7",
        "ping": "^0.4.1",
        "tail": "^2.2.4",
        "telegraf": "^4.7.0",
        "telesignsdk": "^2.2.1",
        "twilio": "^3.76.0",
        "uuid": "^8.3.2"
    },
    "devDependencies": {
        "browserify-fs": "^1.0.0",
        "node-polyfill-webpack-plugin": "^1.1.4",
        "webpack-cli": "^4.9.2"
    }
};

export default manifest;