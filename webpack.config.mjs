// @todo: https://github.com/webpack/webpack/issues/2933#issuecomment-774253975

import { createRequire } from 'module';
import { resolve } from 'path';
import { utilitas } from './index.mjs';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import webpack from 'webpack';

const { __dirname } = utilitas.__(import.meta.url);
const require = createRequire(import.meta.url);

export default {
    entry: './index.mjs',
    experiments: { topLevelAwait: true },
    mode: 'production',
    devtool: 'source-map',
    node: { __dirname: false, __filename: false },
    optimization: { minimize: true },
    plugins: [
        new NodePolyfillPlugin(),
        new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
        new webpack.ProvidePlugin({ process: 'process/browser.js' }),
        new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            switch (mod) {
                case 'buffer': resource.request = 'buffer'; break;
                case 'stream': resource.request = 'stream-browserify'; break; // readable-stream
                case 'stream/web': resource.request = 'stream-browserify'; break; // readable-stream
                case 'url': resource.request = 'url'; break;
                default: throw new Error(`Not found ${mod}`);
            }
        }),
    ],
    target: ['web'],
    output: {
        asyncChunks: false,
        filename: 'utilitas.lite.mjs',
        path: resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.mjs', '.cjs', '.js', '.json', '.node'],
        fallback: {
            'buffer': require.resolve('buffer/'),
            'fs': require.resolve('browserify-fs'),
        },
        alias: {
            'child_process': false,
            'crypto': false,
            'mathjs': false,
            'os': false,
            'worker_threads': false,
            'file-type': 'file-type/core',
            [utilitas.__(import.meta.url, 'lib/alan.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/bot.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/cache.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/callosum.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/dbio.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/rag.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/email.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/media.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/memory.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/network.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/sentinel.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/shell.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/sms.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/ssl.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/tape.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/vision.mjs')]: false,
            [utilitas.__(import.meta.url, 'lib/web.mjs')]: false,
        },
    },
    externals: [
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
    ignoreWarnings: [warning =>
        (warning?.loc?.start?.line === 75 && warning?.loc?.start?.column === 31 && warning?.loc?.end?.line === 75 && warning?.loc?.end?.column === 57)   // event
        ||
        (warning?.loc?.start?.line === 782 && warning?.loc?.start?.column === 44 && warning?.loc?.end?.line === 782 && warning?.loc?.end?.column === 56) // utilitas
    ],
    // stats: 'detailed',
};
