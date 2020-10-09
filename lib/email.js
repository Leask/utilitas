'use strict';

let senderName = null;
let senderEmail = null;
let from = null;
let client = null;

const init = (options) => {
    if (options && options.senderName && options.senderEmail) {
        senderName = options.senderName;
        senderEmail = options.senderEmail;
        from = `${senderName} <${senderEmail}>`;
        client = mailgun(options);
    }
    utilitas.assert(client, 'Email client has not been initialized.', 500);
    return client;
};

const rawSend = async (data) => {
    return await init().messages().send(data);
};

const send = async (email, subject, text, html, args, options) => {
    email = utilitas.ensureArray(email);
    for (let i in email) {
        email[i] = utilitas.trim(email[i]).toLowerCase();
        utilitas.assertEmail(email[i], 'Invalid email.', 500);
    }
    email = utilitas.uniqueArray(email);
    subject = utilitas.trim(subject);
    text = utilitas.trim(text);
    html = utilitas.trim(html);
    utilitas.assert(subject, 'Subject is required.', 500);
    utilitas.assert(text, 'Text body is required.', 500);
    for (let i in args || {}) {
        text = text.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
        html = html.replace(new RegExp(`{{${i}}}`, 'ig'), args[i]);
    }
    const data = { from, to: email, subject, text };
    if (html) {
        data.html = html;
    }
    return await rawSend(data);
}

module.exports = {
    init,
    rawSend,
    send,
};

const utilitas = require('./utilitas');
const mailgun = require('mailgun-js');

// (async () => {
//     init({
//         apiKey: '',
//         domain: '',
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
