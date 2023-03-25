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
        new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
            const mod = resource.request.replace(/^node:/, '');
            switch (mod) {
                case 'buffer': resource.request = 'buffer'; break;
                case 'stream': resource.request = 'readable-stream'; break;
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
            buffer: require.resolve('buffer/'),
            fs: require.resolve('browserify-fs'),
        },
        alias: {
            'child_process': false,
            'crypto': false,
            'mathjs': false,
            'os': false,
            'worker_threads': false,
        },
    },
    externals: [
        { './lib/bot.mjs': '{}' },
        { './lib/cache.mjs': '{}' },
        { './lib/callosum.mjs': '{}' },
        { './lib/dbio.mjs': '{}' },
        { './lib/email.mjs': '{}' },
        { './lib/hal.mjs': '{}' },
        { './lib/network.mjs': '{}' },
        { './lib/sentinel.mjs': '{}' },
        { './lib/shell.mjs': '{}' },
        { './lib/sms.mjs': '{}' },
        { './lib/speech.mjs': '{}' },
        { './lib/ssl.mjs': '{}' },
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
        return ((warning?.loc?.start?.line === 75 // event
            && warning?.loc?.start?.column === 31
            && warning?.loc?.end?.line === 75
            && warning?.loc?.end?.column === 57
        ) || (warning?.loc?.start?.line === 554 // utilitas
            && warning?.loc?.start?.column === 44
            && warning?.loc?.end?.line === 554
            && warning?.loc?.end?.column === 56
            ));
    }],
    // stats: 'detailed',
};
