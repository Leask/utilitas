import * as utilitas from './utilitas.mjs';

const log = (content) => { return utilitas.modLog(content, 'email'); };

let domain, senderName, senderEmail, provider, client;

const throwInvalidProvider = (message, status) => {
    utilitas.throwError(message || 'Invalid email provider.', status || 500);
};

const init = async (options) => {
    if (options) {
        assert(options.senderEmail, 'Sender email is required.', 500);
        senderEmail = options.senderEmail;
        senderName = options.senderName || (await utilitas.which()).name;
        provider = utilitas.trim(options.provider, { case: 'UP' });
        let engine;
        switch (provider) {
            case 'MAILGUN':
                const formData = (await import('form-data')).default;
                const mailgun = (await import('mailgun.js')).default;
                domain = options.domain;
                engine = new mailgun(formData);
                client = engine.client(options);
                break;
            case 'MAILJET':
                engine = (await import('node-mailjet')).default;
                client = engine.connect(options.apiKey, options.apiSecret);
                break;
            default:
                throwInvalidProvider();
        }
        if (!options.silent) {
            log(`Initialized: ${senderName} <${senderEmail}> via ${provider}.`);
        }
    }
    assert(client, 'Email client has not been initialized.', 501);
    return client;
};

const getSenderName = () => {
    return senderName;
};

const rawSend = async (data) => {
    let [payload, instance, fromName, fromEmail] = [null, await init(),
        data.senderName || senderName, data.senderEmail || senderEmail];
    switch (provider) {
        case 'MAILGUN':
            payload = Object.assign({
                from: `${fromName} <${fromEmail}>`,
                to: data.to,
                subject: data.subject,
                text: data.text,
            }, data.html ? { html: data.html } : {});
            return await instance.messages.create(domain, payload);
        case 'MAILJET':
            payload = Object.assign({
                'FromEmail': fromEmail,
                'FromName': fromName,
                'Subject': data.subject,
                'Recipients': data.to.map((eml) => { return { Email: eml }; }),
                'Text-part': data.text,
            }, data.html ? { 'Html-part': data.html } : {});
            return await instance.post('send').request(payload);
        default:
            throwInvalidProvider();
    }
};

const send = async (email, subject, text, html, args, options) => {
    options = options || {};
    email = utilitas.ensureArray(email);
    for (let i in email) {
        email[i] = utilitas.trim(email[i]).toLowerCase();
        utilitas.assertEmail(email[i], 'Invalid email.', 500);
    }
    subject = utilitas.trim(subject);
    text = utilitas.trim(text);
    html = utilitas.trim(html);
    assert(subject, 'Subject is required.', 500);
    assert(text, 'Text body is required.', 500);
    for (let i in args || {}) {
        subject = subject.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
        text = text.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
        html = html.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
    }
    return await rawSend(Object.assign({
        senderName: options.senderName, senderEmail: options.senderEmail,
        to: utilitas.uniqueArray(email), subject, text
    }, html ? { html } : {}));
}

export default init;
export {
    getSenderName,
    init,
    rawSend,
    send,
};



// (async () => {
//     init({
//         provider: 'MAILGUN',
//         username: 'api',
//         key: '',
//         domain: '',
//         senderName: 'Leask Wong',
//         senderEmail: 'i@leaskh.com'
//     });
//     init({
//         provider: 'MAILJET',
//         apiKey: '',
//         apiSecret: '',
//         senderName: 'Leask Wong',
//         senderEmail: 'i@leaskh.com'
//     });
//     console.log(await send(
//         'i@leaskh.com',
//         'Hello, World!',
//         'The quick brown fox jumps over the lazy dog.',
//         '<html>The quick brown fox jumps over the lazy dog. (HTML)</html>'
//     ));
// })();
