import { basename, extname } from 'path';
import { readdir } from 'fs/promises';
import { storage } from './index.mjs';
// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
import manifest from './package.json' assert { type: 'json' };

// Update manifest {
delete manifest.scripts;
const strManifest = [
    `const manifest = ${JSON.stringify(manifest, null, 4)};`,
    'export default manifest;',
].join('\n\n');
await storage.writeFile('./lib/manifest.mjs', strManifest);
// }

// Update README.md {
// var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func) {
//     var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//     var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//     if (result === null)
//         result = [];
//     return result;
// }

// const template = './template.md';
// const target = './README.md';
// let readme = await storage.readFile(template);
// const files = (await readdir('./lib')).filter(f => extname(f) === '.mjs');
// for (let file of files) {
//     const filename = `./lib/${file}`;
//     const module = await import(filename);
//     const allKeys = Object.getOwnPropertyNames(module);
//     allKeys.sort();
//     const [valueKeys, funcKeys] = [[], []];
//     for (let key of allKeys) {
//         (Function.isFunction(module[key]) ? funcKeys : valueKeys).push(key);

//         // try {
//         //     if (Function.isFunction(module[i])) {
//         //         const x = getParamNames(module[i]);
//         //         console.log(x);
//         //     } else {
//         //         console.log('VAR');
//         //     }
//         // } catch (e) {
//         //     console.log(e);
//         // }
//     }
//     readme += `\n### [${basename(file).replace(/\.mjs$/ig, '')}](${filename})\n\n`
//         + '```JavaScript\n'
//         + JSON.stringify(Object.getOwnPropertyNames(module))
//         + '\n```\n';
// };
// await storage.writeFile(target, readme);
// // }
