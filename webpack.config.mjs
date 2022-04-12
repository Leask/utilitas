// @todo: https://github.com/webpack/webpack/issues/2933#issuecomment-774253975

import { createRequire } from 'module';
import { resolve } from 'path';
import { utilitas } from './index.mjs';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
// import webpack from 'webpack';

const { __dirname } = utilitas.__(import.meta.url);
const require = createRequire(import.meta.url);

export default {
    entry: './index.mjs',
    experiments: { topLevelAwait: true },
    mode: 'production',
    devtool: 'source-map',
    node: { __dirname: false, __filename: false },
    optimization: { minimize: true },
    plugins: [new NodePolyfillPlugin()],
    target: ['web'],
    output: {
        asyncChunks: false,
        filename: 'utilitas.lite.mjs',
        path: resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.mjs', '.cjs', '.js', '.json', '.node'],
        fallback: { fs: require.resolve('browserify-fs') },
        alias: {
            '@sentry': false,
            '@sentry/node': false,
            'child_process': false,
            'crypto': false,
            'fast-geoip': false,
            'file-type': false,
            'form-data': false,
            'ini': false,
            'ioredis': false,
            'jsonwebtoken': false,
            'mailgun.js': false,
            'mathjs': false,
            'mysql2': false,
            'mysql2/promise': false,
            'node-fetch': false,
            'node-mailjet': false,
            'ping': false,
            'qrcode': false,
            'readline-sync': false,
            'tail': false,
            'telegraf': false,
            'telesignsdk': false,
            'twilio': false,
            'worker_threads': false,
            'yargs-parser': false,
        },
    },
    externals: [
        { './lib/bot.mjs': '{}' },
        { './lib/cache.mjs': '{}' },
        { './lib/dbio.mjs': '{}' },
        { './lib/email.mjs': '{}' },
        { './lib/network.mjs': '{}' },
        { './lib/sentinel.mjs': '{}' },
        { './lib/shell.mjs': '{}' },
        { './lib/sms.mjs': '{}' },
        { './lib/tape.mjs': '{}' },
        // { 'node:buffer': '{}' },
        // { 'node:stream': '{}' },
        // { 'node:fs': '{}' },
        // { 'node:http': '{}' },
        // { 'node:https': '{}' },
        // { 'node:net': '{}' },
        // { 'node:path': '{}' },
        // { 'node:process': '{}' },
        // { 'node:stream/web': '{}' },
        // { 'node:url': '{}' },
        // { 'node:util': '{}' },
        // { 'node:zlib': '{}' },
    ],
    ignoreWarnings: [warning => {
        return ((warning?.loc?.start?.line === 77 // utilitas.event
            && warning?.loc?.start?.column === 31
            && warning?.loc?.end?.line === 77
            && warning?.loc?.end?.column === 57
        ));
    }],
    // stats: 'detailed',
};
