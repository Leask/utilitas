/**
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 * - Learn more at https://developers.cloudflare.com/workers/
 */

const TOKEN = '';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
};

const fetchOptions = {
    redirect: 'follow',
    follow: 3,
    timeout: 1000 * 10,
    headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            + 'AppleWebKit/605.1.15 (KHTML, like Gecko) '
            + 'Version/17.0 Safari/605.1.15',
    },
};

const handleOptions = async req => new Response(
    null, { headers: CORS_HEADERS }
);

const handleFetch = async req => {
    const { searchParams } = new URL(req.url);
    if (TOKEN && TOKEN !== searchParams.get('token')) {
        return new Response('Access denied', { status: 403 });
    }
    const url = searchParams.get('url');
    if (!url) { return new Response('Invalid url', { status: 400 }); }
    const objUrl = new URL(url);
    try {
        const [resp, headers] = [await fetch(objUrl, fetchOptions), {}];
        for (const [k, v] of resp.headers.entries()) { headers[k] = v; }
        const response = new Response(resp.body, {
            headers: { ...headers, ...CORS_HEADERS },
        });
        return response;
    } catch (err) {
        return new Response(err.message, { status: 400 });
    }
};

export default {
    fetch: async (req, env, ctx) => {
        switch (req.method) {
            case 'OPTIONS':
                return handleOptions(req);
            case 'GET':
                return handleFetch(req);
            default:
                return new Response(null, {
                    status: 405,
                    statusText: "Method Not Allowed",
                });
        }
    }
};
