'use strict';

const getVersionOnNpm = async (packName) => {
    utilitas.assert(packName, 'Package name is required.', 400);
    const url = `https://registry.npmjs.org/-/package/${packName}/dist-tags`;
    const rp = await fetch(url).then(res => res.json());
    utilitas.assert(rp, 'Error fetching package info.', 500);
    utilitas.assert(rp !== 'Not Found' && rp.latest, 'Package not found.', 404);
    return utilitas.parseVersion(rp.latest);
};

const checkVersion = async (pack) => {
    const objPack = await utilitas.which(pack);
    const curVersion = objPack.versionNormalized;
    const newVersion = await getVersionOnNpm(objPack.name);
    return {
        name: objPack.name, curVersion, newVersion,
        updateAvailable: newVersion.normalized > curVersion.normalized,
    }
};

const getCurrentPosition = async() => {
    const url = `https://geolocation-db.com/json`;
    const rp = await fetch(url).then(res => res.json());
    utilitas.assert(rp, 'Network is unreachable.', 500);
    utilitas.assert(rp.country_code, 'Error detecting geolocation.', 500);
    return rp;
};

module.exports = {
    checkVersion,
    getCurrentPosition,
    getVersionOnNpm,
};

const utilitas = require('./utilitas');
const fetch = require('node-fetch').default;
