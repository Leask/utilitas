import { ensureString, need, throwError, tryUntil } from './utilitas.mjs';
import { MIME_PNG, convert } from './storage.mjs';

const _NEED = ['OpenAI'];

const [
    clients, OPENAI, GEMINI, BASE64, BUFFER, ERROR_GENERATING, IMAGEN_MODEL,
    OPENAI_MODEL, VEO_MODEL,
] = [
        {}, 'OPENAI', 'GEMINI', 'BASE64', 'BUFFER', 'Error generating image.',
        'imagen-3.0-generate-002', 'gpt-image-1', 'veo-2.0-generate-001',
    ];

const init = async (options) => {
    assert(
        options?.apiKey || (options?.projectId && options?.accessToken),
        'API key or project ID (with access token) are required.'
    );
    const provider = ensureString(options?.provider, { case: 'UP' });
    switch (provider) {
        case OPENAI:
            const OpenAI = await need('openai');
            const openai = new OpenAI(options);
            clients[provider] = openai.images;
            break;
        case GEMINI:
            clients[provider] = {
                apiKey: options.apiKey,
                projectId: options.projectId,
                accessToken: options.accessToken,
            };
            break;
        default:
            throw new Error('Invalid provider.');
    }
    return clients;
};

const extractImage = async (data, options) => await convert(
    data, { input: BASE64, suffix: 'png', ...options || {} }
);

const extractVideo = async (data, options) => await convert(
    data, { input: BASE64, suffix: 'mp4', ...options || {} }
);

const generateImage = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GEMINI] && client.apiKey) { provider = GEMINI; }
    if (!provider && clients?.[OPENAI]) { provider = OPENAI; }
    const client = clients?.[provider];
    const n = options?.n || 4;
    assert(client, 'No available image generation provider.');
    prompt = ensureString(prompt);
    assert(prompt.length <= 4000,
        'Prompt must be less than 4000 characters.', 400);
    options = {
        ...options || {},
        expected: ensureString(options?.expected || BUFFER, { case: 'LOW' }),
    };
    switch (provider) {
        case OPENAI:
            try { // https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1
                var resp = await client.generate({
                    prompt, model: OPENAI_MODEL, n, quality: 'high',
                    size: '1536x1024', moderation: 'low',
                    // 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), auto (default)
                    // background: 'transparent',
                    ...options?.params || {},
                });
            } catch (err) { throwError(err?.message || ERROR_GENERATING); }
            if (!options?.raw) {
                resp.data = await Promise.all(resp.data.map(async x => ({
                    caption: `🎨 by ${OPENAI_MODEL}`,
                    data: await extractImage(x.b64_json, options),
                    mimeType: MIME_PNG,
                })));
            }
            return resp?.data;
        case GEMINI:
            var resp = await (await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/'
                + `${IMAGEN_MODEL}:predict?key=${client.apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }], parameters: {
                        sampleCount: n, aspectRatio: '16:9',
                        ...options?.params || {},
                    }, // "1:1" (default), "3:4", "4:3", "9:16", and "16:9"
                })
            })).json();
            assert(!resp?.error, resp?.error?.message || ERROR_GENERATING);
            if (!options?.raw) {
                resp = await Promise.all((resp?.predictions || []).map(
                    async x => ({
                        caption: `🎨 by ${IMAGEN_MODEL}`,
                        data: await extractImage(x.bytesBase64Encoded, options),
                        mimeType: x.mimeType,
                    })
                ));
            }
            return resp;
        default:
            throw new Error('Invalid provider.');
    }
};

const getGeminiVideo = async (jobId) => {
    const client = clients?.[GEMINI];
    assert(client, 'No available video generation provider.');
    const resp = await (await fetch(
        'https://us-central1-aiplatform.googleapis.com/v1/projects/'
        + `${client.projectId}/locations/us-central1/publishers/google/models/`
        + `${VEO_MODEL}:fetchPredictOperation`, {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${client.accessToken}`,
        },
        body: JSON.stringify({
            operationName: jobId,
        })
    })).json();
    assert(
        resp?.response?.videos?.length,
        `Waiting for Gemini video generation: \`${jobId}\`...`
    );
    return resp?.response?.videos;
};

const generateVideo = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GEMINI] && client.accessToken) {
        provider = GEMINI;
    }
    const client = clients?.[provider];
    assert(client, 'No available video generation provider.');
    prompt = ensureString(prompt);
    assert(prompt.length <= 4000,
        'Prompt must be less than 4000 characters.', 400);
    options = {
        ...options || {},
        expected: ensureString(options?.expected || BUFFER, { case: 'LOW' }),
    };
    switch (provider) {
        case GEMINI:
            var resp = await (await fetch(
                'https://us-central1-aiplatform.googleapis.com/v1/projects/'
                + `${client.projectId}/locations/us-central1/publishers/google/`
                + `models/${VEO_MODEL}:predictLongRunning`, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${client.accessToken}`,
                },
                body: JSON.stringify({
                    instances: [{ prompt }], parameters: {
                        aspectRatio: '16:9', sampleCount: 4,
                        durationSeconds: '8', fps: '24',
                        personGeneration: 'allow_adult',
                        enablePromptRewriting: true, addWatermark: false,
                        includeRaiReason: true, ...options?.params || {},
                    },
                })
            })).json();
            assert(
                !resp?.error && resp?.name,
                resp?.error?.message || ERROR_GENERATING
            );
            if (options?.generateRaw) { return resp; }
            var videos = await tryUntil(
                async () => await getGeminiVideo(resp.name),
                { maxTry: 60 * 10, log: true }
            );
            assert(videos?.length, 'Failed to generate Gemini video.');
            if (options?.videoRaw) { return videos; }
            return await Promise.all(videos.map(async x => ({
                caption: `🎥 by ${VEO_MODEL}`,
                data: await extractVideo(x.bytesBase64Encoded, options),
                mimeType: x.mimeType, jobId: resp.name,
            })));
        default:
            throw new Error('Invalid provider.');
    }
};

export default init;
export {
    _NEED,
    generateImage,
    generateVideo,
    getGeminiVideo,
    init,
};
