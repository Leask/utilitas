import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { web } from '../index.mjs';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const JINA_KEY = config?.jina_key;
const SEARCH_QUERY = 'site:developers.openai.com/api OpenAI API documentation';

const skipReasonJina = !JINA_KEY && 'jina_key is missing from config.json';

const assertOpenAiSearchResults = response => {
    assert.equal(response.provider, 'JINA');
    assert.ok(Array.isArray(response.items));
    assert.ok(response.items.length > 0);

    const validUrls = response.items.map(item => item.link).filter(Boolean);
    assert.ok(validUrls.length > 0);
    for (const link of validUrls) {
        assert.doesNotThrow(() => new URL(link));
    }

    const openAiResults = response.items.filter(item => {
        let url;
        try { url = new URL(item.link); } catch {
            return false;
        }
        const text = `${item.title} ${item.snippet}`.toLowerCase();
        return url.hostname.endsWith('openai.com')
            && text.includes('openai')
            && text.includes('api');
    });
    assert.ok(
        openAiResults.length > 0,
        `Expected OpenAI API search result, got: ${validUrls.join(', ')}`,
    );
};

test('web getCurrentPosition', async () => {
    try {
        const pos = await web.getCurrentPosition();
        assert.ok(pos.IPv4);
    } catch (e) {
        console.warn('getCurrentPosition test skipped/failed:', e.message);
    }
});

test('web get caches request variants by accept header', async () => {
    let requests = 0;
    const cache = await mkdtemp(join(tmpdir(), 'utilitas-web-cache-'));
    const server = createServer((req, res) => {
        requests++;
        res.setHeader('ETag', '"variant"');
        res.setHeader('Vary', 'Accept');
        if (req.headers['if-none-match'] === '"variant"') {
            res.writeHead(304);
            res.end();
            return;
        }

        const accept = req.headers.accept || '';
        if (accept.includes('application/json')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ type: 'json', requests }));
            return;
        }
        res.setHeader('Content-Type', 'text/plain');
        res.end(`text:${requests}`);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

    try {
        const url = `http://127.0.0.1:${server.address().port}/variant`;
        const json = await web.get(url, {
            encode: 'JSON', cache: { tmp: cache },
            fetch: { headers: { Accept: 'application/json' } },
        });
        assert.deepEqual(json.content, { type: 'json', requests: 1 });

        const text = await web.get(url, {
            encode: 'TEXT', cache: { tmp: cache },
            fetch: { headers: { Accept: 'text/plain' } },
        });
        assert.equal(text.content, 'text:2');
    } finally {
        await new Promise(resolve => server.close(resolve));
        await rm(cache, { force: true, recursive: true });
    }
});

test('web get caches private variants by header digest', async () => {
    let requests = 0;
    const cache = await mkdtemp(join(tmpdir(), 'utilitas-web-cache-'));
    const server = createServer((req, res) => {
        requests++;
        res.setHeader('ETag', '"private-variant"');
        res.setHeader('Vary', 'Authorization, Cookie');
        if (req.headers['if-none-match'] === '"private-variant"') {
            res.writeHead(304);
            res.end();
            return;
        }

        res.setHeader('Content-Type', 'text/plain');
        res.end([
            req.headers.authorization,
            req.headers.cookie,
            requests,
        ].join('|'));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

    try {
        const url = `http://127.0.0.1:${server.address().port}/private`;
        const first = await web.get(url, {
            encode: 'TEXT', cache: { tmp: cache },
            fetch: {
                headers: {
                    Authorization: 'Bearer first',
                    Cookie: 'sid=first',
                },
            },
        });
        assert.equal(first.content, 'Bearer first|sid=first|1');

        const second = await web.get(url, {
            encode: 'TEXT', cache: { tmp: cache },
            fetch: {
                headers: {
                    Authorization: 'Bearer second',
                    Cookie: 'sid=second',
                },
            },
        });
        assert.equal(second.content, 'Bearer second|sid=second|2');
    } finally {
        await new Promise(resolve => server.close(resolve));
        await rm(cache, { force: true, recursive: true });
    }
});

test('web search jina', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search(SEARCH_QUERY, {
        provider: 'Jina', image: false, num: 5,
    });
    assertOpenAiSearchResults(response);
});

test('web search jina aiFriendly', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search(SEARCH_QUERY, {
        provider: 'Jina', aiFriendly: true, num: 3,
    });

    assert.equal(typeof response, 'string');
    assert.match(response, /OpenAI API/i);
    assert.match(response, /developers\.openai\.com|openai\.com\/api/i);
});

test('web distill jina', { skip: skipReasonJina }, async () => {
    await web.initDistill({ provider: 'JINA', apiKey: JINA_KEY });
    const response = await web.distill('https://platform.openai.com/docs/guides/prompt-engineering');
    assert.ok(response.summary);
    assert.ok(response.summary.length > 0);
});
