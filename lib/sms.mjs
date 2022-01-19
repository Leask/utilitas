import * as utilitas from './utilitas.mjs';
import util from 'util';

const defaultTeleSignApi = 'https://rest-api.telesign.com';
const defaultTimeout = 1000 * 10 // 10 secs
const log = (content) => { return utilitas.modLog(content, 'sms'); };

let sender, provider, client, sendFunc;

const throwInvalidProvider = (message, status) => {
    utilitas.throwError(message || 'Invalid SMS provider.', status || 500);
};

const init = async (options) => {
    if (options) {
        provider = utilitas.trim(options.provider, { case: 'UP' });
        let engine;
        switch (provider) {
            case 'TWILIO':
                utilitas.assert(sender = options.phoneNumber,
                    'Sender phone number is required.', 500);
                engine = await import('twilio');
                client = new engine(options.accountSid, options.authToken);
                break;
            case 'TELESIGN':
                engine = await import('telesignsdk');
                client = new engine(
                    options.customerId, options.apiKey,
                    options.rest_endpoint || defaultTeleSignApi,
                    options.timeout || defaultTimeout
                );
                sendFunc = util.promisify((phone, message, msgType, cbf) => {
                    return client.sms.message(cbf, phone, message, msgType);
                });
                break;
            default:
                throwInvalidProvider();
        }
        if (!options.silent) {
            log(`Initialized: ${options.accountSid
                || options.customerId} via ${provider}.`);
        }
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
            return await sendFunc(phone, message, 'ARN');
        default:
            throwInvalidProvider();
    }
};

export {
    init,
    send,
};
