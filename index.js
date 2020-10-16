'use strict';

const path = require('path');
const fs = require('fs');

const libPath = path.join(__dirname, 'lib');

module.exports = {
    mailgun: require('mailgun-js'),
    mailjet: require('node-mailjet'),
    colors: require('colors/safe'),
    mysql: require('mysql2/promise'),
    ping: require('ping'),
    uuid: require('uuid'),
};

fs.readdirSync(libPath).filter((file) => {
    return /\.js$/i.test(file) && file.indexOf('.') !== 0;
}).forEach((file) => {
    module.exports[file.replace(/^(.*)\.js$/, '$1')]
        = require(path.join(libPath, file));
});
