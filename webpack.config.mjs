// @todo: https://github.com/webpack/webpack/issues/2933#issuecomment-774253975

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const dist = path.resolve(__dirname, 'dist');
const asyncChunks = false;

const base = {
    mode: 'production',
    entry: './index.mjs',
    // optimization: { minimize: true },
    experiments: { topLevelAwait: true },
    resolve: {
        extensions: ['.mjs', '.cjs', '.js', '.json', '.node'],
        alias: {
            // 'tape.mjs': false,
            '@sentry/node': false,
            'fast-geoip': false,
            'ioredis': false,
            'mailgun-js': false,
            'mysql2': false,
            'node-mailjet': false,
            'readline-sync': false,
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
    node: { __dirname: false, __filename: false },
};

export default [
    // {
    //     ...base, ...{
    //         target: ['node16'], // , 'electron16-main'
    //         experiments: { ...base.experiments, outputModule: true },
    //         output: {
    //             path: dist,
    //             filename: 'index.mjs',
    //             asyncChunks,
    //             library: { type: 'module' },
    //         },
    //     },
    // },
    {
        ...base, ...{
            target: ['web'],
            output: {
                path: dist,
                filename: 'index.web.mjs',
                asyncChunks,
            },
            plugins: [
                new NodePolyfillPlugin()
            ],
            resolve: {
                ...base.resolve,
                alias: {
                    ...base.resolve.alias,
                    child_process: false,
                    // module: false,
                    ping: false,
                    tail: false,
                },
                fallback: {
                    fs: require.resolve('browserify-fs'),
                },
            },
            externals: [
                ...base.externals,
                { 'node:buffer': '{}' },
                { 'node:stream': '{}' },
                // { './lib/dbio.mjs': '{}' },

            ]
        },
    }
];
