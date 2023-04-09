import { assembleUrl, ignoreErrFunc, need } from './utilitas.mjs';
import { getJson, getParsedHtml } from './shot.mjs';

const _NEED = ['@mozilla/readability', 'jsdom', 'youtube-transcript'];
// https://stackoverflow.com/questions/19377262/regex-for-youtube-url
const YT_REGEXP = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i;
const isYoutubeUrl = url => (url || '').match(YT_REGEXP)?.[6];
const distillPage = async (url, op) => (await getParsedHtml(url, op))?.content;

const distillHtml = async (html, options) => {
    const lib = await Promise.all([need('jsdom'), need('@mozilla/readability')]);
    const [JSDOM, Readability] = [lib[0].JSDOM, lib[1].Readability];
    const _doc = new JSDOM(html)?.window?.document;
    assert(_doc, 'Failed to parse HTML.', 500);
    const content = new Readability(_doc).parse();
    assert(content, 'Failed to distill HTML.', 500);
    if (!options?.raw) {
        content.textContent = content.textContent.trim().split('\n').map(x => x.trim());
        for (let i = content.textContent.length - 1; i >= 0; i--) {
            if ((i < content.textContent.length - 1)
                && content.textContent[i] === ''
                && content.textContent[i + 1] === '') {
                content.textContent.splice(i, 1);
            }
        }
        content.textContent = content.textContent.join('\n');
    }
    return {
        byline: content.byline, data: {}, html: content.html,
        lang: content.lang, provider: content.siteName,
        text: content.textContent, thumbnail: null,
        title: content.title, type: 'WEBPAGE',
    };
};

const assertYoutubeUrl = url => {
    const videoCode = isYoutubeUrl(url);
    assert(videoCode, 'Invalid YouTube URL.', 400);
    return videoCode;
};

const getYoutubeTranscript = async (url) => {
    const { YoutubeTranscript } = await need('youtube-transcript');
    const videoCode = assertYoutubeUrl(url);
    const transcript = await ignoreErrFunc(
        async () => await YoutubeTranscript.fetchTranscript(videoCode)
    );
    return transcript ? {
        transcript, transcript_text: transcript.map(x => x.text).join('\n'),
    } : null;
};

const getYoutubeMetadata = async (url) => {
    assertYoutubeUrl(url);
    const content = (await getJson(assembleUrl(
        'https://www.youtube.com/oembed', { url, format: 'json' }
    )))?.content;
    assert(content, 'Failed to get YouTube metadata.', 500);
    return content;
};

const distillYoutube = async (url) => {
    const [metadata, transcript] = await Promise.all([
        getYoutubeMetadata(url),
        getYoutubeTranscript(url),
    ]);
    const content = { ...metadata, ...transcript };
    return {
        byline: `${content.author_name} (${content.author_url})`,
        data: { transcript: content.transcript }, html: content.html,
        lang: null,
        provider: `${content.provider_name} (${content.provider_url})`,
        text: content.transcript_text, thumbnail: content.thumbnail_url,
        title: content.title, type: 'VIDEO',
    };
};

const distill = async url => {
    let content;
    if (isYoutubeUrl(url)) { content = await distillYoutube(url); }
    else { content = await distillPage(url); }
    return {
        content, summary: [
            '---', `title: ${content.title}`, `byline: ${content.byline}`,
            `provider: ${content.provider}`, `type: ${content.type}`, '---',
            content.text,
        ].join('\n'),
    };
};

export {
    _NEED,
    assertYoutubeUrl,
    distill,
    distillHtml,
    distillPage,
    distillYoutube,
    getYoutubeMetadata,
    getYoutubeTranscript,
    isYoutubeUrl,
};
