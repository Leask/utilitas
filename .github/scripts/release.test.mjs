import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./release.mjs', import.meta.url));
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

const fixture = async (t, version = '1.0.0') => {
    const root = await mkdtemp(join(tmpdir(), 'npm-release-test-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const cwd = join(root, 'work');
    const origin = join(root, 'origin.git');
    const bin = join(root, 'bin');
    const statePath = join(root, 'registry.json');
    const git = (...args) => execFileSync('git', args, {
        cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    await mkdir(cwd);
    await mkdir(bin);
    git('init', '--bare', '--initial-branch=main', origin);
    git('init', '--initial-branch=main');
    git('config', 'user.name', 'Release Test');
    git('config', 'user.email', 'test@example.invalid');
    git('remote', 'add', 'origin', origin);
    await writeFile(join(cwd, 'package.json'), JSON.stringify({
        name: 'ci-release-test', version,
    }, null, 2) + '\n');
    git('add', 'package.json');
    git('commit', '-m', 'Source change');
    git('push', '-u', 'origin', 'main');
    const source = git('rev-parse', 'HEAD');
    const state = {
        latest: '1.0.0',
        versions: { '1.0.0': { version: '1.0.0', gitHead: source } },
        attempts: 0,
    };
    await writeFile(statePath, JSON.stringify(state));
    // This executable only simulates npm; no real publication can occur.
    await writeFile(join(bin, 'npm'), `#!/usr/bin/env node
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (process.argv[2] === 'version') {
    pkg.version = process.argv[3];
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\\n');
} else if (process.argv[2] === 'publish') {
    const file = process.env.TEST_REGISTRY_STATE;
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    state.attempts++;
    if (!state.fail) {
        state.versions[pkg.version] = {
            version: pkg.version,
            gitHead: execFileSync('git', ['rev-parse', 'HEAD'], {
                encoding: 'utf8',
            }).trim(),
        };
        state.latest = pkg.version;
    }
    fs.writeFileSync(file, JSON.stringify(state));
    if (state.fail) { process.exit(1); }
} else { process.exit(2); }
`, { mode: 0o755 });
    const server = createServer(async (req, res) => {
        const state = await readJson(statePath);
        const version = req.url.split('/').pop();
        const value = state.versions[
            version === 'latest' ? state.latest : version
        ];
        res.writeHead(value ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(value || { error: 'not found' }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const env = {
        ...process.env, GITHUB_SHA: source, RELEASE_BRANCH: 'main',
        RUNNER_TEMP: root, GITHUB_OUTPUT: join(root, 'outputs'),
        npm_config_registry: `http://127.0.0.1:${server.address().port}`,
        TEST_REGISTRY_STATE: statePath,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
    };
    return {
        cwd, origin, root, source, git,
        run: (command, extra = {}) => exec(process.execPath, [script, command], {
            cwd, env: { ...env, ...extra }, timeout: 15000,
        }),
        state: () => readJson(statePath),
        update: async changes => writeFile(statePath,
            JSON.stringify({ ...await readJson(statePath), ...changes })),
        version: async () => (await readJson(join(cwd, 'package.json'))).version,
    };
};

test('release bumps after publication and reruns do not bump again', async t => {
    const f = await fixture(t);
    await f.run('prepare');
    assert.equal(await f.version(), '1.0.1');
    assert.equal(f.git('rev-parse', 'origin/main'), f.source);
    await f.run('publish');
    const commit = f.git('rev-parse', 'origin/main');
    assert.equal(f.git('rev-list', '-1', 'v1.0.1'), commit);
    assert.match(f.git('log', '-1', '--format=%B'), /Release-Source:/);
    assert.equal((await f.state()).versions['1.0.1'].gitHead, commit);
    assert.match((await f.run('prepare')).stdout, /already published/);
    assert.equal((await f.state()).attempts, 1);
    assert.equal(await f.version(), '1.0.1');
    assert.match((await f.run('prepare', { GITHUB_SHA: commit })).stdout,
        /already published/);
});

test('release resumes the same version after npm failure', async t => {
    const f = await fixture(t);
    await f.run('prepare');
    await f.update({ fail: true });
    await assert.rejects(f.run('publish'));
    const commit = f.git('rev-parse', 'origin/main');
    await f.update({ fail: false });
    assert.match((await f.run('prepare')).stdout, /Resuming/);
    assert.equal(await f.version(), '1.0.1');
    await f.run('publish');
    assert.equal(f.git('rev-parse', 'origin/main'), commit);
    assert.equal((await f.state()).attempts, 2);
    assert.equal((await f.state()).latest, '1.0.1');
});

test('release reuses an explicitly bumped unpublished version', async t => {
    const f = await fixture(t, '1.0.1');
    await f.run('prepare');
    assert.equal(await f.version(), '1.0.1');
    await f.run('publish');
    assert.equal((await f.state()).latest, '1.0.1');
});

test('release does not overwrite a branch that advances during tests', async t => {
    const f = await fixture(t);
    await f.run('prepare');
    const other = join(f.root, 'other');
    f.git('clone', f.origin, other);
    execFileSync('git', ['-C', other, '-c', 'user.name=Other',
        '-c', 'user.email=other@example.invalid',
        'commit', '--allow-empty', '-m', 'New source']);
    execFileSync('git', ['-C', other, 'push', 'origin', 'main']);
    assert.match((await f.run('publish')).stdout, /branch advanced/);
    assert.equal((await f.state()).attempts, 0);
    assert.equal(f.git('tag', '--list', 'v1.0.1'), '');
    assert.match((await f.run('prepare')).stdout, /newer commit/);
});

test('release refuses a version published from another commit', async t => {
    const f = await fixture(t);
    await f.run('prepare');
    await f.update({ fail: true });
    await assert.rejects(f.run('publish'));
    const state = await f.state();
    state.versions['1.0.1'] = { version: '1.0.1', gitHead: f.source };
    await f.update(state);
    await assert.rejects(f.run('prepare'), /different commit/);
});

test('release does not move npm latest back to an older version', async t => {
    const f = await fixture(t);
    await f.run('prepare');
    await f.update({ fail: true });
    await assert.rejects(f.run('publish'));
    const state = await f.state();
    state.versions['1.0.2'] = { version: '1.0.2', gitHead: 'newer' };
    await f.update({ ...state, latest: '1.0.2', fail: false });
    await f.run('prepare');
    await assert.rejects(f.run('publish'), /move latest backwards/);
    assert.equal((await f.state()).attempts, 1);
});
