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
const [lib, fileType, ignore] = ['./lib', '.mjs', new Set(['manifest.mjs'])];
const concat = arr => arr.join(mdSpace);
const extReg = new RegExp(RegExp.escape(fileType), 'ig');
const getBasename = file => basename(file).replace(extReg, '');
const newTr = arr => [mdSpace, ...arr, mdSpace].join(mdSplit) + newLine;
const [mdSplit, mdSpace, mdThirdTitle, newLine] = [' | ', '', '###', '\n'];
const [alignedNone, alignedLeft, alignedCenter, alignedRight, dulLine]
    = ['---', ':---', ':---:', '---:', `${newLine}${newLine}`];
const files = (await readdir(lib)).filter(
    f => extname(f) === fileType && !ignore.has(f)
);
const mdTableHead = concat([
    ['symbol', 'type', 'params / value'],
    [alignedLeft, alignedLeft, alignedLeft]
].map(newTr));
const readme = [await storage.readFile('./template.md')];
for (let file of files) {
    const filename = `${lib}/${file}`;
    const mod = utilitas.analyzeModule(await import(filename));
    readme.push(
        `${newLine}${mdThirdTitle} [${getBasename(file)}](${filename})`
        + `${dulLine}${mdTableHead}` + concat(Object.keys(mod).map(k => newTr(
            [k, mod[k].type, mod[k]?.params?.join?.(', ') || mod[k].value]
        )))
    );
};
await storage.writeFile('./README.md', concat(readme));
// }
