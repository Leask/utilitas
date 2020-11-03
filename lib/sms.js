'use strict';

const defaultTeleSignApi = 'https://rest-api.telesign.com';
const defaultTimeout = 1000 * 10 // 10 secs

let sender = null;
let engine = null;
let provider = null;
let client = null;

const log = (content) => { return utilitas.modLog(content, __filename); };

const throwInvalidProvider = (message, status) => {
    utilitas.throwError(message || 'Invalid SMS provider.', status || 500);
};

const init = (options) => {
    if (options) {
        provider = utilitas.trim(options.provider, { case: 'UP' });
        switch (provider) {
            case 'TWILIO':
                utilitas.assert(sender = options.phoneNumber,
                    'Sender phone number is required.', 500);
                engine = require('twilio');
                client = new engine(options.accountSid, options.authToken);
                break;
            case 'TELESIGN':
                engine = require('telesignsdk');
                client = new engine(
                    options.customerId, options.apiKey,
                    options.rest_endpoint || defaultTeleSignApi,
                    options.timeout || defaultTimeout
                );
                break;
            default:
                throwInvalidProvider();
        }
        log(`Initialized: ${options.accountSid
            || options.customerId} via ${provider}.`);
    }
    utilitas.assert(client, 'SMS client has not been initialized.', 501);
    return client;
};

const send = async (phone, message) => {
    utilitas.assert(phone, 'Invalid phone number.', 500);
    utilitas.assert(message, 'Message is required.', 500);
    switch (provider) {
        case 'TWILIO':
            return await client.messages.create({
                from: sender, to: phone, body: message
            });
        case 'TELESIGN':
            return await util.promisify((phone, message, msgType, callback) => {
                return client.sms.message(callback, phone, message, msgType);
            })(phone, message, 'ARN');
        default:
            throwInvalidProvider();
    }
};

module.exports = {
    init,
    send,
};

const utilitas = require('./utilitas');
const util = require('util');
