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
