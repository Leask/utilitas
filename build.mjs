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
const [template, target] = ['./template.md', './README.md'];
const ignore = new Set(['manifest.mjs']);
const [alignedNone, alignedLeft, alignedCenter, alignedRight, mdTableSplit]
    = ['---', ':---', ':---:', '---:', ' | '];
let readme = await storage.readFile(template);
const files = (await readdir('./lib')).filter(f => extname(f) === '.mjs' && !ignore.has(f));
for (let file of files) {
    const filename = `./lib/${file}`;
    const module = await import(filename);
    const desc = utilitas.analyzeModule(module);
    readme += `\n### [${basename(file).replace(/\.mjs$/ig, '')}](${filename})\n\n`
        + ['', 'name', 'type', 'params / value', ''].join(mdTableSplit) + '\n'
        + ['', alignedLeft, alignedLeft, alignedLeft, ''].join(mdTableSplit) + '\n'

    for (let key in desc) {
        readme += ['', key, desc[key].type, desc[key]?.params?.join?.(', ') || desc[key].value, ''].join(mdTableSplit) + '\n';
    }
};
await storage.writeFile(target, readme);
// }
