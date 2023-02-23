# 🧰 utilitas

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node.js Package](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml)

Just another common utility for JavaScript.

Works in Node.js and modern browsers.

## APIs

### [bot](./lib/bot.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | end | AsyncFunction | options | 
 | init | AsyncFunction | options | 
 | send | AsyncFunction | chatId, content, options | 

### [cache](./lib/cache.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 

### [callosum](./lib/callosum.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | boardcast | Function | action, data | 
 | default | AsyncFunction | func, interval, tout, delay, name, options | 
 | engage | Function | worker, action, data | 
 | get | Function |  | 
 | getListeners | Function | i | 
 | ignore | Function | i | 
 | init | AsyncFunction | options | 
 | on | Function | action, callback, options | 
 | once | Function | action, cbf, opts | 
 | report | Function | action, data | 
 | set | Function | key, value | 

### [color](./lib/color.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [dbio](./lib/dbio.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | assembleInsert | Function | table, data, options | 
 | assembleQuery | Function | table, options | 
 | assembleSet | Function | data, options | 
 | assembleTail | Function | options | 
 | assembleUpdate | Function | table, data, options | 
 | countAll | AsyncFunction | table | 
 | countByKeyValue | AsyncFunction | table, key, value | 
 | default | AsyncFunction | options | 
 | deleteAll | AsyncFunction | table, options | 
 | deleteById | Function | table, id, options | 
 | deleteByKeyValue | AsyncFunction | table, key, value, options | 
 | end | AsyncFunction | options | 
 | execute | AsyncFunction |  | 
 | init | AsyncFunction | options | 
 | insert | AsyncFunction | table, fields, options | 
 | query | AsyncFunction |  | 
 | queryAll | Function | table, options | 
 | queryById | AsyncFunction | table, id, options | 
 | queryByKeyValue | AsyncFunction | table, key, value, options | 
 | rawAssembleKeyValue | Function | key, value, options | 
 | rawExecute | AsyncFunction |  | 
 | rawQuery | AsyncFunction |  | 
 | updateById | AsyncFunction | table, id, fields, options | 
 | updateByKeyValue | AsyncFunction | table, key, value, fields, options | 
 | upsert | Function | table, fields, options | 

### [email](./lib/email.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | getSenderName | Function |  | 
 | init | AsyncFunction | options | 
 | rawSend | AsyncFunction | data | 
 | send | AsyncFunction | email, subject, text, html, args, options | 

### [encryption](./lib/encryption.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | defaultAlgorithm | String | sha256 | 
 | digestObject | Function | object, algorithm | 
 | getSortedQueryString | Function | obj | 
 | hash | Function | string, algorithm | 
 | hashFile | Function | filename, algorithm | 
 | hexToBigInt | Function | hex | 
 | random | Function | size, callback | 
 | randomString | Function | length, encoding | 
 | sha256 | Function | string, algorithm | 
 | sha256File | Function | filename, algorithm | 
 | uniqueString | Function | any | 

### [event](./lib/event.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | bulk | AsyncFunction | absDir, options | 
 | default | AsyncFunction | func, interval, tout, delay, name, options | 
 | end | AsyncFunction | name | 
 | list | Function |  | 
 | load | AsyncFunction | module, options | 
 | loop | AsyncFunction | func, interval, tout, delay, name, options | 

### [horizon](./lib/horizon.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [network](./lib/network.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | getCurrentPosition | AsyncFunction |  | 
 | httping | AsyncFunction | url, options | 
 | isLocalhost | Function | host | 
 | pickFastestHost | AsyncFunction | hosts, options | 
 | pickFastestHttpServer | AsyncFunction | urls, options | 
 | ping | AsyncFunction | host, options | 

### [sentinel](./lib/sentinel.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 

### [shekel](./lib/shekel.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | getExchangeRate | AsyncFunction | to, from, amount | 

### [shell](./lib/shell.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | assertExist | AsyncFunction | bin, er, code | 
 | default | AsyncFunction | command, options | 
 | exec | AsyncFunction | command, options | 
 | exist | Function | bin | 
 | which | AsyncFunction | bin | 

### [shot](./lib/shot.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | checkVersion | AsyncFunction | pack | 
 | default | AsyncFunction | url, options | 
 | get | AsyncFunction | url, options | 
 | getCurrentIp | AsyncFunction | options | 
 | getCurrentPosition | AsyncFunction |  | 
 | getVersionOnNpm | AsyncFunction | packName | 

### [sms](./lib/sms.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 
 | send | AsyncFunction | to, body | 

### [storage](./lib/storage.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | assertPath | AsyncFunction | path, type, mode, msg, code, options | 
 | encodeBase64DataURL | Function | mime, buffer | 
 | exists | AsyncFunction | filename | 
 | getConfig | AsyncFunction | options | 
 | getConfigFilename | AsyncFunction | options | 
 | getTempPath | Function | options | 
 | isTextFile | AsyncFunction | filename, options | 
 | legalFilename | Function | filename | 
 | mapFilename | Function | name | 
 | readFile | Function | name, opts | 
 | readIni | AsyncFunction | filename, options | 
 | readJson | AsyncFunction | filename, options | 
 | setConfig | AsyncFunction | data, options | 
 | touchPath | AsyncFunction | path, options | 
 | writeFile | Function | f, data, o | 
 | writeIni | Function | f, data, o | 
 | writeJson | Function | f, data, opts | 
 | writeTempFile | AsyncFunction | data, options | 

### [tape](./lib/tape.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | addChatId | Function | id | 
 | default | AsyncFunction | options | 
 | end | AsyncFunction |  | 
 | init | AsyncFunction | options | 
 | removeChatId | Function | id | 

### [uoid](./lib/uoid.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | bigIntToUuid | Function |  | 
 | compactUuid | Function | str | 
 | create | Function | options | 
 | default | Function | options | 
 | expandUuid | Function |  | 
 | fakeUuid | Function | any | 
 | getRfcUrlNamespaceUuid | Function | url | 
 | getTimestampFromUuid | Function | uuid | 
 | getUuidForCurrentHost | Function | any | 
 | rotateUuid | Function | any, step, options | 
 | uuidRegTxt | String | [0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12} | 
 | uuidToBigInt | Function | str | 

### [utilitas](./lib/utilitas.mjs)

 | name | type | params / value | 
 | :--- | :--- | :--- | 
 | __ | Function | url, r | 
 | analyzeModule | Function | obj | 
 | arrayEqual | Function | arrA, arrB | 
 | assembleApiUrl | Function | hst, path, args | 
 | assembleUrl | Function | url, componens | 
 | assertArray | Function | arr, message, status, opts | 
 | assertDate | Function | time, message, status, options | 
 | assertEmail | Function | email, message, status, options | 
 | assertFunction | Function | fn, message, status, opts | 
 | assertModule | Function | mdl, message, status, opts | 
 | assertObject | Function | obj, message, status, opts | 
 | assertSet | Function | value, message, status, options | 
 | assertUrl | Function | url, message, status, options | 
 | assertUuid | Function | uuid, message, status, options | 
 | asyncTimeout | AsyncFunction | pms, timeout, err | 
 | base64Decode | Function | string, toBuf | 
 | base64Encode | Function | object, isBuf | 
 | base64Pack | Function | object | 
 | base64Unpack | Function | string | 
 | basename | Function | filename | 
 | byteToHexString | Function | byteArray | 
 | checkInterval | Function | itv, sed | 
 | clone | Function | any | 
 | convertBase | Function | ipt, from, to | 
 | convertFrom16to10 | Function | ipt | 
 | distill | Function | any, strict | 
 | ensureArray | Function |  | 
 | ensureDate | Function | dt, options | 
 | ensureInt | Function | any, options | 
 | ensureString | Function | str, options | 
 | extError | Function | err, status, opt | 
 | extract | Function |  | 
 | fileURLToPath | Function | path | 
 | fullLengthLog | Function | string, options | 
 | getDateByUnixTimestamp | Function | timestamp | 
 | getFuncParams | Function | func | 
 | getItemFromStringOrArray | Function | any | 
 | getKeyByValue | Function | object, value | 
 | getRandomIndexInArray | Function | array | 
 | getRandomInt | Function | max | 
 | getRandomItemInArray | Function | array | 
 | getShortestInArray | Function | arr | 
 | getType | Function | any | 
 | getUnixTimestampByDate | Function | date | 
 | hexDecode | Function | string, toBuf | 
 | hexEncode | Function | object, isBuf | 
 | humanReadableBoolean | Function | any | 
 | ignoreErrFunc | AsyncFunction | func, options | 
 | inBrowser | Function |  | 
 | insensitiveCompare | Function | strA, strB, options | 
 | is | Function | type, any | 
 | isAscii | Function | str | 
 | isModule | Function | module | 
 | isNull | Function | object | 
 | isSet | Function | o, strict | 
 | isUndefined | Function | any | 
 | log | Function | content, filename, options | 
 | makeStringByLength | Function | string, length | 
 | mapKeys | Function | any, map, strict, path | 
 | mask | Function | str, options | 
 | matchVersion | Function | curVer, tgtVer | 
 | mergeAtoB | Function | objA, objB, o | 
 | newError | Function | msg, status, opt | 
 | once | Function | fn, context | 
 | parseJson | Function | any, fallback | 
 | parseVersion | Function | verstr | 
 | prettyJson | Function | object, opt | 
 | purgeEmoji | Function | any, replace | 
 | range | Function | from, to, options | 
 | renderCode | Function | code, options | 
 | resolve | AsyncFunction | resp | 
 | rotate | Function | any, step, opts | 
 | shiftTime | Function | dif, base | 
 | split | Function | str, options | 
 | throwError | Function | msg, status, opt | 
 | timeout | Function | ms | 
 | toExponential | Function | x, f | 
 | toString | Function | any, options | 
 | trim | Function | str, opts | 
 | tryUntil | AsyncFunction | fnTry, options | 
 | uniqueArray | Function | array | 
 | verifyEmail | Function | any | 
 | verifyPhone | Function | phone | 
 | verifyUrl | Function | url | 
 | verifyUuid | Function | uuid | 
 | which | AsyncFunction | any | 
