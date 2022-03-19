// @todo: https://github.com/webpack/webpack/issues/2933#issuecomment-774253975

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
// import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

export default {
    entry: './index.mjs',
    experiments: { topLevelAwait: true },
    mode: 'production',
    node: { __dirname: false, __filename: false },
    optimization: { minimize: true },
    plugins: [new NodePolyfillPlugin()],
    target: ['web'],
    output: {
        asyncChunks: false,
        filename: 'utilitas.lite.mjs',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.mjs', '.cjs', '.js', '.json', '.node'],
        fallback: { fs: require.resolve('browserify-fs') },
        alias: {
            '@sentry/node': false,
            'child_process': false,
            'fast-geoip': false,
            'ioredis': false,
            'mailgun-js': false,
            'mysql2': false,
            'node-mailjet': false,
            'ping': false,
            'readline-sync': false,
            'tail': false,
            'telegraf': false,
            'telesignsdk': false,
            'twilio': false,
        },
    },
    externals: [
        { './lib/bot.mjs': '{}' },
        { './lib/cache.mjs': '{}' },
        { './lib/dbio.mjs': '{}' },
        { './lib/email.mjs': '{}' },
        { './lib/sentinel.mjs': '{}' },
        { './lib/sms.mjs': '{}' },
        { './lib/tape.mjs': '{}' },
        { 'node:buffer': '{}' },
        { 'node:stream': '{}' },
    ],
    // ignoreWarnings: [warning => {
    //     return ((warning?.loc?.start?.line === 83 // utilitas.event
    //         && warning?.loc?.start?.column === 31
    //         && warning?.loc?.end?.line === 83
    //         && warning?.loc?.end?.column === 62
    //     ) || (warning?.loc?.start?.line === 75 // utilitas.bot
    //         && warning?.loc?.start?.column === 32
    //         && warning?.loc?.end?.line === 75
    //         && warning?.loc?.end?.column === 63
    //         ));
    // }],
};
