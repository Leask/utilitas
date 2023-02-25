import { basename, extname } from 'path';
import { readdir } from 'fs/promises';
import { storage, utilitas } from './index.mjs';
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
// https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables
const [lib, ignore, DEFAULT] = ['./lib', new Set(['manifest.mjs']), 'default'];
const fileTypes = ['.cjs', '.mjs'];
const concat = arr => arr.join('');
const extReg = new RegExp(fileTypes.map(RegExp.escape).join('|'), 'ig');
const getBasename = file => basename(file).replace(extReg, '');
const newTr = arr => ['', ...arr, ''].join(' | ') + '\n';
const readme = [await storage.readFile('./template.md')];
const [alignedNone, alignedLeft, alignedCenter, alignedRight]
    = ['---', ':---', ':---:', '---:'];
const files = (await readdir(lib)).filter(
    f => fileTypes.includes(extname(f)) && !ignore.has(f)
);
const mdTableHead = concat([
    ['symbol', 'type', 'params / value'],
    [alignedLeft, alignedLeft, alignedLeft]
].map(newTr));
for (let file of files) {
    const filename = `${lib}/${file}`;
    const m = utilitas.analyzeModule(await import(filename));
    readme.push(
        `\n### [${getBasename(file)}](${filename})\n\n${mdTableHead}` + concat([
            ...m[DEFAULT] ? [DEFAULT] : [],
            ...Object.keys(m).filter(k => k !== DEFAULT)
        ].map(k => newTr([k, m[k].type, m[k].params?.join(', ') || m[k].value])))
    );
};
await storage.writeFile('./README.md', concat(readme));
// }
