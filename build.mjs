import { writeFile } from './lib/storage.mjs';
import manifest from './package.json' assert { type: 'json' };

// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
delete manifest.scripts;
const strManifest = [
    `const manifest = ${JSON.stringify(manifest, null, 4)};`,
    'export default manifest;',
].join('\n\n');

await writeFile('./lib/manifest.mjs', strManifest);
