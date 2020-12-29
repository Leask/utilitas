'use strict';

const getVersionOnNpm = async (packName) => {
    utilitas.assert(packName, 'Package name is required.', 400);
    const url = `https://registry.npmjs.org/-/package/${packName}/dist-tags`;
    const rp = await fetch(url).then(res => res.json());
    utilitas.assert(rp, 'Error fetch package info.', 500);
    utilitas.assert(rp !== 'Not Found' && rp.latest, 'Package not found.', 404);
    return rp.latest;
};

module.exports = {
    getVersionOnNpm,
};

const utilitas = require('./utilitas');
const fetch = require('node-fetch');
