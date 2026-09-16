import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { GITHUB_SHA: source, RELEASE_BRANCH: branch, RUNNER_TEMP: temp } = process.env;
assert(source && /^[a-f0-9]{40}$/.test(source), 'A source commit is required.');
assert(branch && temp, 'RELEASE_BRANCH and RUNNER_TEMP are required.');
const registry = process.env.npm_config_registry || 'https://registry.npmjs.org';
const planPath = join(temp, 'npm-release.json');
const run = (command, args) => execFileSync(command, args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'],
}).trim();
const git = (...args) => run('git', args);
const pkg = () => JSON.parse(readFileSync('package.json', 'utf8'));
const output = skip => {
    console.log(skip ? 'Release skipped.' : 'Release ready.');
    if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `skip=${skip}\n`);
    }
};
const fetchBranch = () => {
    git('fetch', '--tags', 'origin', branch);
    return git('rev-parse', `origin/${branch}`);
};
const tagExists = tag => !!git('tag', '--list', tag);
const readVersion = async (name, version) => {
    const response = await fetch(
        `${registry.replace(/\/$/, '')}/${encodeURIComponent(name)}/${version}`,
        { signal: AbortSignal.timeout(30000) },
    );
    if (response.status === 404) { return null; }
    assert(response.ok, `Registry lookup failed: HTTP ${response.status}`);
    return response.json();
};
const stableVersion = version => {
    assert(/^\d+\.\d+\.\d+$/.test(version),
        `Automatic releases require a stable version: ${version}`);
    return version.split('.').map(Number);
};
const newer = (a, b) => {
    a = stableVersion(a);
    b = stableVersion(b);
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) { return a[i] > b[i]; }
    }
    return false;
};

const prepare = async () => {
    const tip = fetchBranch();
    // A rerun starts at the original source SHA, not its release commit.
    let commit = git('log', '--first-parent', '-1', '--format=%H',
        '--fixed-strings', `--grep=Release-Source: ${source}`, `origin/${branch}`);
    // Manual dispatch from the release commit also resumes that release.
    const message = git('log', '-1', '--format=%B', source);
    if (!commit && /^\[RELEASE\] /m.test(message)
        && /^Release-Source: [a-f0-9]{40}$/m.test(message)) {
        commit = source;
    }
    if (!commit && tip !== source) {
        console.log('A newer commit is on the branch; its workflow will publish.');
        output(true);
        return;
    }
    git('checkout', '--detach', commit || source);
    const { name, version } = pkg();
    let next = version;
    if (commit) {
        assert.equal(git('rev-list', '-1', `v${version}`), commit,
            'The release tag does not match the release commit.');
        const published = await readVersion(name, version);
        if (published) {
            assert.equal(published.gitHead, commit,
                'This version was published from a different commit.');
            console.log(`${name}@${version} is already published.`);
            output(true);
            return;
        }
    } else {
        // Reuse an explicitly bumped, unpublished version (including webjam's
        // previously failed release). Otherwise advance the patch version.
        for (let attempt = 0; ; attempt++) {
            assert(attempt < 100, 'Unable to find an unused patch version.');
            if (!tagExists(`v${next}`) && !await readVersion(name, next)) { break; }
            const [major, minor, patch] = stableVersion(next);
            next = `${major}.${minor}.${patch + 1}`;
        }
        stableVersion(next);
        if (next !== version) {
            run('npm', ['version', next, '--no-git-tag-version', '--ignore-scripts']);
        }
    }
    writeFileSync(planPath, JSON.stringify({
        source, branch, name, version: next, commit,
    }));
    console.log(`${commit ? 'Resuming' : 'Preparing'} ${name}@${next}`);
    output(false);
};

const publish = async () => {
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    assert.equal(plan.source, source);
    assert.equal(plan.branch, branch);
    assert.equal(pkg().name, plan.name);
    assert.equal(pkg().version, plan.version);
    const tip = fetchBranch();
    const tag = `v${plan.version}`;
    if (!plan.commit) {
        if (tip !== source) {
            console.log('The branch advanced during testing; skipping this release.');
            return;
        }
        git('add', ...['package.json', 'README.md', 'lib/manifest.mjs']
            .filter(existsSync));
        git('-c', 'user.name=github-actions[bot]',
            '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
            'commit', '--allow-empty', '-m', `[RELEASE] ${plan.version}`,
            '-m', `Release-Source: ${source}`);
        plan.commit = git('rev-parse', 'HEAD');
        git('tag', tag);
        // Never force-push. A competing user push rejects both refs atomically.
        git('push', '--atomic', 'origin',
            `HEAD:refs/heads/${branch}`, `refs/tags/${tag}`);
    } else {
        assert.equal(git('rev-parse', 'HEAD'), plan.commit);
        assert.equal(git('rev-list', '-1', tag), plan.commit);
    }
    assert.equal(git('status', '--porcelain', '--untracked-files=no'), '',
        'The tested tree differs from the release commit.');
    const published = await readVersion(plan.name, plan.version);
    if (published) {
        assert.equal(published.gitHead, plan.commit,
            'This version was published from a different commit.');
        console.log(`${plan.name}@${plan.version} is already published.`);
        return;
    }
    const latest = await readVersion(plan.name, 'latest');
    assert(!latest || !newer(latest.version, plan.version),
        'A newer version is already on npm; refusing to move latest backwards.');
    // Publish this tested checkout. npm records its gitHead for safe reruns.
    run('npm', ['publish', '--provenance', '--access', 'public']);
    console.log(`Published ${plan.name}@${plan.version} (${plan.commit}).`);
};

const commands = { prepare, publish };
assert(commands[process.argv[2]], 'Use prepare or publish.');
await commands[process.argv[2]]();
