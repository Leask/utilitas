'use strict';

let senderName = null;
let senderEmail = null;
let provider = null;
let engine = null;
let client = null;

const throwInvalidProvider = (message, status) => {
    utilitas.throwError(message || 'Invalid email provider.', status || 500);
};

const init = async (options) => {
    if (options && options.senderEmail && options.provider) {
        senderName = options.senderName || (await utilitas.which()).name;
        senderEmail = options.senderEmail;
        provider = utilitas.trim(options.provider, { case: 'UP' });
        switch (provider) {
            case 'MAILGUN':
                engine = require('mailgun-js');
                client = engine(options);
                break;
            case 'MAILJET':
                engine = require('node-mailjet');
                client = engine.connect(options.apiKey, options.apiSecret);
                break;
            default:
                throwInvalidProvider();
        }
    }
    utilitas.assert(client, 'Email client has not been initialized.', 500);
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
            return await instance.messages().send(payload);
        case 'MAILJET':
            payload = Object.assign({
                'FromEmail': fromEmail,
                'FromName': fromName,
                'Subject': data.subject,
                'Recipients': data.to,
                'Text-part': data.text,
            }, data.html ? { 'Html-part': data.html } : {});
            return await instance.post('send').request(payload);
        default:
            throwInvalidProvider();
    }
};

const send = async (email, subject, text, html, args, options) => {
    email = utilitas.ensureArray(email);
    for (let i in email) {
        email[i] = utilitas.trim(email[i]).toLowerCase();
        utilitas.assertEmail(email[i], 'Invalid email.', 500);
    }
    subject = utilitas.trim(subject);
    text = utilitas.trim(text);
    html = utilitas.trim(html);
    utilitas.assert(subject, 'Subject is required.', 500);
    utilitas.assert(text, 'Text body is required.', 500);
    for (let i in args || {}) {
        subject = subject.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
        text = text.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
        html = html.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
    }
    return await rawSend(Object.assign({
        senderName: options.senderName, sendEmail: options.sendEmail,
        to: utilitas.uniqueArray(email), subject, text
    }, html ? { html } : {}));
}

module.exports = {
    getSenderName,
    init,
    rawSend,
    send,
};

const utilitas = require('./utilitas');

// (async () => {
//     init({
//         provider: 'MAILGUN',
//         apiKey: '',
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
