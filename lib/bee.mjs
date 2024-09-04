import { convert } from './storage.mjs';
import { log as _log, need } from './utilitas.mjs';

const _NEED = ['puppeteer'];

let [engine, browser] = [null, null];

const init = async () => {
    if (!engine || !browser) {
        engine = await need('puppeteer');
        browser = await engine.launch();
    }
    assert(engine && browser, 'Browser initialization failed.');
    return { engine, browser };
};

const browse = async (url, options) => {
    await init();
    assert(url, 'URL is required.');
    const page = await browser.newPage();
    await page.setViewport(options?.viewport || { width: 1280, height: 720 });
    let title, newUrl, texts, links, screenshot, pdf, err;
    try {
        await page.goto(url, {
            waitUntil: 'networkidle2', timeout: 1000 * (~~options?.wait || 60),
            ...options?.goto || {},
        });
        if (options?.raw) { return page; }
        await page.evaluate('globalThis.utilitasBeeOptions = '
            + JSON.stringify(options || {}));
        const foundUrls = new Set();
        [title, newUrl, texts, links, screenshot, pdf] = await Promise.all([
            page.title(),
            page.url(),
            page.evaluate(() => Array.from(document.querySelectorAll(
                utilitasBeeOptions?.selector || 'body'
            )).map(e => e.innerText)),
            (async () => (await page.evaluate(() =>
                Array.from(document.querySelectorAll('a')).map(
                    e => ({ text: e.innerText, title: e.title, href: e.href }))
            )).filter(x => {
                const v = x.href?.toLowerCase?.()?.startsWith?.('http')
                    && !foundUrls.has(x.href);
                foundUrls.add(x.href);
                return v;
            }))(),
            (async () => options?.screenshot ? await convert(
                await page.screenshot({ fullPage: true, ...options.screenshot }),
                { suffix: 'png', ...options.screenshot }
            ) : null)(),
            (async () => options?.pdf ? await convert(
                await page.pdf(options.pdf), { suffix: 'pdf', ...options.pdf }
            ) : null)(),
        ]);
    } catch (e) { err = e; } finally {
        await page.close();
        if (err) { throw err; }
    }
    return { title, url: newUrl, texts, links, screenshot, pdf };
};

const end = async () => {
    browser && await browser.close();
    [browser, engine] = [null, null];
};

export default init;
export {
    _NEED,
    browse,
    end,
    init,
};
