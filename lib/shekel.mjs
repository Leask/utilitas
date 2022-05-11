import { assertSet, ensureString } from './utilitas.mjs';
import { bignumber, divide, multiply } from 'mathjs';
import { get } from './shot.mjs';

const _getRate = (rates, currency) => {
    const rate = rates[ensureString(currency || 'USD', { case: 'UP' })];
    assertSet(rate, `Unsupported currency: '${currency}'.`, 400);
    return bignumber(rate);
};

const getExchangeRate = async (to, from, amount) => {
    const data = {};
    ((await get(
        'https://api.mixin.one/external/fiats', { encode: 'JSON' }
    ))?.content?.data || []).map(x => data[x.code] = x.rate);
    assert(Object.keys(data).length, 'Error fetching exchange rates.', 500);
    if (!to) { return data; }
    [to, from] = [_getRate(data, to), _getRate(data, from)];
    const rate = divide(to, from);
    amount = multiply(bignumber(amount ?? 1), rate);
    return { rate, amount: amount.toString() };
};

export { getExchangeRate };
