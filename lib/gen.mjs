import {
    ensureArray, ensureString, ignoreErrFunc, log as _log, need, throwError,
    tryUntil,
} from './utilitas.mjs';

import { assertExist, exec } from './shell.mjs';
import { convert, MIME_PNG } from './storage.mjs';
import { createReadStream } from 'fs';

const _NEED = ['OpenAI'];
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const [
    clients, OPENAI, GEMINI, BASE64, BUFFER, ERROR_GENERATING, IMAGEN_MODEL,
    OPENAI_MODEL, VEO_MODEL,
] = [
        {}, 'OPENAI', 'GEMINI', 'BASE64', 'BUFFER', 'Error generating image.',
        'imagen-3.0-generate-002', 'gpt-image-1', 'veo-2.0-generate-001',
    ];

const init = async (options) => {
    assert(
        options?.apiKey || (options?.credentials && options?.projectId),
        'API key or credentials are required.'
    );
    const provider = ensureString(options?.provider, { case: 'UP' });
    switch (provider) {
        case OPENAI:
            const OpenAI = await need('openai');
            const openai = new OpenAI(options);
            clients[provider] = {
                image: openai.images,
                toFile: OpenAI.toFile,
            };
            break;
        case GEMINI:
            clients[provider] = {
                apiKey: options.apiKey,
                projectId: options.projectId,
                credentials: options.credentials,
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

const prepareImage = async (files, repack, options) => {
    if (!files) { return }
    const multiple = Array.isArray(files);
    files = ensureArray(files);
    const resp = await Promise.all(files.map(async x => await repack(
        createReadStream(await convert(
            x, { expected: 'FILE', ...options || {} }
        )), null, { type: MIME_PNG } // don't need to be right MIME type
    )));
    return multiple ? resp : resp[0];
};


const image = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GEMINI]?.apiKey) { provider = GEMINI; }
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
            let [func, extraOptions] = ['generate', {}];
            if (options?.reference || options?.mask) {
                func = 'edit';
                extraOptions = {
                    image: await prepareImage(options?.reference, client.toFile, options),
                    mask: await prepareImage(options?.mask, client.toFile, options),
                };
            }
            try { // https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1
                var resp = await client.image[func]({
                    prompt, model: OPENAI_MODEL, n, quality: 'high',
                    size: '1536x1024', moderation: 'low',
                    // 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), auto (default)
                    // background: 'transparent',
                    ...extraOptions, ...options?.params || {},
                });
            } catch (err) { throwError(err?.message || ERROR_GENERATING); }
            if (!options?.raw) {
                resp.data = await Promise.all(resp.data.map(async x => ({
                    caption: `🎨 by ${OPENAI_MODEL}`,
                    data: await extractImage(x.b64_json, {
                        ...options || {}, input: BASE64,
                    }),
                    mimeType: MIME_PNG,
                })));
            }
            return resp?.data;
        case GEMINI:
            // Image editing failed with the following error: imagen-3.0-capability-001 is unavailable.
            // @todo: https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview#feature-launch-stage
            // cat << EOF > request.json
            // {
            //     "endpoint": "projects/backend-alpha-97077/locations/us-central1/publishers/google/models/imagen-3.0-capability-001",
            //     "instances": [
            //         {
            //             "prompt": "ENTER PROMPT HERE",
            //             "referenceImages": [
            //                 {
            //                     "referenceId": 1,
            //                     "referenceType": "REFERENCE_TYPE_SUBJECT",
            //                     "referenceImage": {
            //                         "bytesBase64Encoded":
            //                         },
            //                     "subjectImageConfig" {
            //                         "subjectDescription": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            //                         "subjectType": "SUBJECT_TYPE_DEFAULT"
            //                     }
            //                 }
            //             ],
            //         }
            //     ],
            //     "parameters": {
            //         "aspectRatio": "1:1",
            //         "sampleCount": 4,
            //         "negativePrompt": "",
            //         "enhancePrompt": false,
            //         "personGeneration": "",
            //         "safetySetting": "",
            //         "addWatermark": true,
            //         "includeRaiReason": true,
            //         "language": "auto",
            //     }
            // }
            // curl \
            // -X POST \
            // -H "Content-Type: application/json" \
            // -H "Authorization: Bearer $(gcloud auth print-access-token)" \
            // "https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:predict" -d '@request.json'
            // ARGs: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api?authuser=4#rest_1
            var resp = await (await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/'
                + `${IMAGEN_MODEL}:predict?key=${client.apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }], parameters: {
                        // "1:1" (default), "3:4", "4:3", "9:16", and "16:9"
                        aspectRatio: '16:9', includeRaiReason: true,
                        personGeneration: 'allow_adult', sampleCount: n,
                        ...options?.params || {},
                    },
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

const getGeminiAccessToken = async (credentials) => {
    const bin = 'gcloud';
    await assertExist(bin);
    const actResp = await ignoreErrFunc(async () => await exec(
        `${bin} auth activate-service-account --key-file=${credentials}`,
        { acceptError: true }
    ), { log: true });
    assert(actResp?.includes?.('Activated service account credentials'),
        'Failed to activate service account credentials.', 500);
    const tokResp = (await exec(`gcloud auth print-access-token`)).trim();
    assert(tokResp, 'Failed to get access token.', 500);
    return tokResp;
};

const getGeminiVideo = async (jobId, accessToken) => {
    const client = clients?.[GEMINI];
    assert(client, 'No available video generation provider.');
    const resp = await (await fetch(
        'https://us-central1-aiplatform.googleapis.com/v1/projects/'
        + `${client.projectId}/locations/us-central1/publishers/google/models/`
        + `${VEO_MODEL}:fetchPredictOperation`, {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        }, body: JSON.stringify({ operationName: jobId })
    })).json();
    assert(resp?.response?.videos?.length,
        'Waiting for Gemini video generation: '
        + jobId.replace(/^.*\/([^/]+)$/, '$1'));
    return resp?.response?.videos;
};

const video = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider
        && clients?.[GEMINI]?.credentials
        && clients?.[GEMINI]?.projectId) { provider = GEMINI; }
    const client = clients?.[provider];
    assert(client, 'No available video generation provider.');
    const accessToken = await getGeminiAccessToken(client.credentials);
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
                    'Authorization': `Bearer ${accessToken}`,
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
            var videos = await tryUntil(async () => await getGeminiVideo(
                resp.name, accessToken
            ), { maxTry: 60 * 10, log });
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
    image,
    init,
    video,
};
