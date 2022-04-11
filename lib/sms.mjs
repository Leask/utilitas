import { log as _log, throwError, trim } from './utilitas.mjs';
import { promisify } from 'util';

const defaultTeleSignApi = 'https://rest-api.telesign.com';
const defaultTimeout = 1000 * 10 // 10 secs
const log = (content) => _log(content, import.meta.url);

let sender, provider, client, sendFunc;

const throwInvalidProvider = (message, status) =>
    throwError(message || 'Invalid SMS provider.', status || 500);

const init = async (options) => {
    if (options) {
        provider = trim(options.provider, { case: 'UP' });
        let engine;
        switch (provider) {
            case 'TWILIO':
                assert(sender = options.phoneNumber,
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
                sendFunc = promisify((phone, message, msgType, cbf) =>
                    client.sms.message(cbf, phone, message, msgType));
                break;
            default:
                throwInvalidProvider();
        }
        if (!options.silent) {
            log(`Initialized: ${options.accountSid
                || options.customerId} via ${provider}.`);
        }
    }
    assert(client, 'SMS client has not been initialized.', 501);
    return client;
};

const send = async (phone, message) => {
    assert(phone, 'Invalid phone number.', 500);
    assert(message, 'Message is required.', 500);
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

export default init;
export {
    init,
    send,
};
