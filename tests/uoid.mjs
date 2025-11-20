import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as utilitas from '../index.mjs';
import { v4 as uuidv4 } from 'uuid';

const uuid = '8f5481d0-1ff9-11eb-929f-5b4e7a7325fe';
const timestamp = 1604634168046;

test('uoid getTimestampFromUuid', () => {
    const ts = utilitas.uoid.getTimestampFromUuid(uuid);
    assert.equal(ts, 1604644227693);
});

test('uoid parse', () => {
    const id = uuidv4();
    const hex = id.replace(/-/g, '');
    const buffer = Buffer.from(hex, 'hex');
    const base64 = buffer.toString('base64');
    const base64Url = buffer.toString('base64url');
    // const uriComponent = encodeURIComponent(id); // Not sure what encoding 'uriComponent' implies for UUID, maybe just string?

    // Helper to check common properties
    const check = (result) => {
        assert.equal(result.uuid, id);
        assert.equal(result.hex, hex);
        assert.equal(result.base64, base64);
        assert.equal(result.base64Url, base64Url);
    };

    // Test parsing UUID string
    check(utilitas.uoid.parse(id));

    // Test parsing Hex
    check(utilitas.uoid.parse(hex, { encoding: 'HEX' }));

    // Test parsing Base64
    check(utilitas.uoid.parse(base64, { encoding: 'BASE64' }));

    // Test parsing Base64Url
    check(utilitas.uoid.parse(base64Url, { encoding: 'BASE64URL' }));
});
