import { basename, extname } from 'path';
import { readdir } from 'fs/promises';
import { shot, storage, utilitas } from './index.mjs';
// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
import manifest from './package.json' with { type: 'json' };

// shared const
const [lib, _manifest, n, nn] = ['./lib', 'manifest.mjs', '\n', '\n\n'];

// Update boxes.json
let style = (await shot.get(
    'https://raw.githubusercontent.com/sindresorhus/cli-boxes/main/boxes.json'
)).content;
assert(style, 'Failed to fetch `boxes`.');
style = JSON.parse(style);
const boxes = [
    '// Based on: https://github.com/sindresorhus/cli-boxes',
    '// Repackaged to ESM by: @Leask', '',
];
for (let i in style) {
    boxes.push(`const ${i} = ${JSON.stringify(style[i], null, 4)};`, '');
}
boxes.push(`export default round;`);
boxes.push(`export {\n    ${Object.keys(style).join(',\n    ')},\n};`, '');
await storage.writeFile(`${lib}/boxes.mjs`, `${boxes.join('\n')}`);

// Update manifest
delete manifest.scripts;
const strManifest = [
    `const manifest = ${JSON.stringify(manifest, null, 4)};`,
    'export default manifest;',
].join(nn);
await storage.writeFile(`${lib}/${_manifest}`, strManifest);

// Update README.md
// https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables
const [ignore, DEFAULT, _NEED, fileTypes]
    = [new Set([_manifest]), 'default', '_NEED', ['.cjs', '.mjs']];
const concat = arr => arr.join('');
const extReg = new RegExp(fileTypes.map(RegExp.escape).join('|'), 'ig');
const getBasename = file => basename(file).replace(extReg, '');
const tr = arr => `${['', ...arr, ''].join(' | ')}${n}`;
const readme = [await storage.readFile('./template.md')];
const [alignedNone, alignedLeft, alignedCenter, alignedRight]
    = ['---', ':---', ':---:', '---:'];
const files = (await readdir(lib)).filter(
    f => fileTypes.includes(extname(f)) && !ignore.has(f)
);
const mdTableHead = concat([
    ['symbol', 'type', 'params / value'],
    [alignedLeft, alignedLeft, alignedLeft]
].map(tr));
for (let file of files) {
    const filename = `${lib}/${file}`;
    const m = utilitas.analyzeModule(await import(filename));
    readme.push(
        `${n}### [${getBasename(file)}](${filename})${nn}${mdTableHead}`
        + concat([
            ...m[_NEED] ? [_NEED] : [],
            ...m[DEFAULT] ? [DEFAULT] : [],
            ...Object.keys(m).filter(k => ![_NEED, DEFAULT].includes(k))
        ].map(k => tr([k, m[k].type, m[k].params?.join(', ') || m[k].value])))
    );
};
await storage.writeFile('./README.md', concat(readme));
