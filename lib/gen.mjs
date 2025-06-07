import {
    ensureArray, ensureString, log as _log, need, throwError,
    tryUntil, timeout,
} from './utilitas.mjs';

import { convert, MIME_PNG, MIME_MP4, getTempPath } from './storage.mjs';
import { createReadStream } from 'fs';

const _NEED = ['OpenAI', '@google/genai'];
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const [
    clients, OPENAI, GEMINI, BASE64, FILE, BUFFER, ERROR_GENERATING,
    IMAGEN_MODEL, OPENAI_MODEL, VEO_MODEL,
] = [
        {}, 'OPENAI', 'GEMINI', 'BASE64', 'FILE', 'BUFFER',
        'Error generating media.', 'imagen-3.0-generate-002', 'gpt-image-1',
        'veo-2.0-generate-001',
    ];

const init = async (options) => {
    assert(options?.apiKey, 'API key is required.');
    const provider = ensureString(options?.provider, { case: 'UP' });
    switch (provider) {
        case OPENAI:
            const OpenAI = await need('openai');
            var client = new OpenAI(options);
            clients[provider] = {
                image: client.images,
                toFile: OpenAI.toFile,
            };
            break;
        case GEMINI:
            const { GoogleGenAI } = await need('@google/genai');
            var client = new GoogleGenAI({ vertexai: false, ...options });
            clients[provider] = {
                gen: client,
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
    data, { input: FILE, suffix: 'mp4', ...options || {} }
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
    if (!provider && clients?.[GEMINI]) { provider = GEMINI; }
    else if (!provider && clients?.[OPENAI]) { provider = OPENAI; }
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
            var resp = await client.gen.models.generateImages({
                model: IMAGEN_MODEL, prompt, config: {
                    numberOfImages: n, includeRaiReason: true,
                    // "1:1" (default), "3:4", "4:3", "9:16", and "16:9"
                    aspectRatio: '16:9', personGeneration: 'allow_adult',
                    ...options?.config || {},
                },
            });
            const generated = resp?.generatedImages;
            assert(!resp?.error && generated?.filter(
                x => !x.raiFilteredReason
            ).length, resp?.error?.message || generated?.find(
                x => x.raiFilteredReason
            )?.raiFilteredReason || ERROR_GENERATING);
            if (!options?.raw) {
                resp = await Promise.all((resp?.generatedImages || []).map(
                    async x => ({
                        caption: `🎨 by ${IMAGEN_MODEL}`,
                        data: await extractImage(x.image.imageBytes, options),
                        mimeType: x.mimeType,
                    })
                ));
            }
            return resp;
        default:
            throw new Error('Invalid provider.');
    }
};

const video = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GEMINI]) { provider = GEMINI; }
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
            var resp = await client.gen.models.generateVideos({
                model: VEO_MODEL, prompt, config: {
                    aspectRatio: '16:9', numberOfVideos: 1,
                    personGeneration: 'allow_adult',
                    enablePromptRewriting: true, addWatermark: false,
                    includeRaiReason: true, ...options?.config || {},
                },
            });
            assert(!resp?.error, resp?.error?.message || ERROR_GENERATING);
            if (options?.generateRaw) { return resp; }
            await tryUntil(async () => {
                resp = await client.gen.operations.getVideosOperation({
                    operation: resp,
                });
                assert(
                    resp?.done,
                    `Waiting for Gemini video generation: ${resp.name}`,
                );
            }, { maxTry: 60 * 10, log });
            let generated = resp?.response?.generatedVideos;
            assert(!resp?.error && generated?.filter(
                x => !x.raiFilteredReason
            ).length, resp?.error?.message || generated?.find(
                x => x.raiFilteredReason
            )?.raiFilteredReason || ERROR_GENERATING);
            if (!options?.videoRaw) {
                generated = await Promise.all(generated?.filter(
                    x => x?.video?.uri
                ).map(async (x, i) => {
                    const downloadPath = `${getTempPath({
                        seed: x?.video?.uri
                    })}.mp4`;
                    // @todo: fix this
                    // https://github.com/googleapis/js-genai/compare/main...Leask:js-genai:main
                    await client.gen.files.download({ file: x, downloadPath });
                    await timeout(1000 * 10); // hack to wait for file to be downloaded
                    return {
                        caption: `🎥 by ${VEO_MODEL}`,
                        data: await extractVideo(downloadPath, options),
                        mimeType: MIME_MP4, jobId: resp.name,
                    };
                }));
            }
            return generated;
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
