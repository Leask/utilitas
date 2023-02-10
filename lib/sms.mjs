import { log as _log, throwError, trim } from './utilitas.mjs';
import { promisify } from 'util';

const defaultTeleSignApi = 'https://rest-api.telesign.com';
const defaultTimeout = 1000 * 10 // 10 secs
const log = (content) => _log(content, import.meta.url);

let from, provider, client, sendFunc;

const throwInvalidProvider = (message, status) =>
    throwError(message || 'Invalid SMS provider.', status || 500);

const init = async (options) => {
    if (options) {
        provider = trim(options.provider, { case: 'UP' });
        let engine;
        switch (provider) {
            case 'TWILIO':
                assert(from = options.phoneNumber,
                    'Sender phone number is required.', 500);
                engine = (await import('twilio')).default;
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

const send = async (to, body) => {
    assert(to, 'Invalid phone number.', 500);
    assert(body, 'Message is required.', 500);
    switch (provider) {
        case 'TWILIO': return await client.messages.create({ from, to, body });
        case 'TELESIGN': return await sendFunc(to, body, 'ARN');
        default: throwInvalidProvider();
    }
};

export default init;
export {
    init,
    send,
};
