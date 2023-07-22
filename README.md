# 🧰 utilitas

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node.js Package](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml)

Just another common utility for JavaScript.

Works in Node.js and modern browsers.

## APIs

### [bot](./lib/bot.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | office-text-extractor,telegraf | 
 | default | AsyncFunction | options | 
 | BINARY_STRINGS | Array | off,on | 
 | COMMAND_DESCRIPTION_LENGTH | Number | 256 | 
 | COMMAND_LENGTH | Number | 32 | 
 | COMMAND_LIMIT | Number | 100 | 
 | EMOJI_BOT | String | 🤖 | 
 | EMOJI_SPEECH | String | 🗣️ | 
 | EMOJI_THINKING | String | 💬 | 
 | GROUP_LIMIT | Number | 3000 | 
 | HELLO | String | Hello! | 
 | MESSAGE_LENGTH_LIMIT | Number | 4096 | 
 | PRIVATE_LIMIT | Number | 1000 | 
 | end | AsyncFunction | async, options | 
 | init | AsyncFunction | options | 
 | lines | Function | arr, sep | 
 | lines2 | Function | arr | 
 | map | Function |  | 
 | newCommand | Function | command, description | 
 | oList | Function | arr, k | 
 | paging | Function | message, options | 
 | send | AsyncFunction | chatId, content, options | 
 | uList | Function | arr | 

### [boxes](./lib/boxes.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {"topLeft":"╭","top":"─","topRight":"╮","right":"│","bottomRight":"╯","bottom":"─","bottomLeft":"╰","left":"│"} | 
 | arrow | Object | {"topLeft":"↘","top":"↓","topRight":"↙","right":"←","bottomRight":"↖","bottom":"↑","bottomLeft":"↗","left":"→"} | 
 | bold | Object | {"topLeft":"┏","top":"━","topRight":"┓","right":"┃","bottomRight":"┛","bottom":"━","bottomLeft":"┗","left":"┃"} | 
 | classic | Object | {"topLeft":"+","top":"-","topRight":"+","right":"|","bottomRight":"+","bottom":"-","bottomLeft":"+","left":"|"} | 
 | double | Object | {"topLeft":"╔","top":"═","topRight":"╗","right":"║","bottomRight":"╝","bottom":"═","bottomLeft":"╚","left":"║"} | 
 | doubleSingle | Object | {"topLeft":"╒","top":"═","topRight":"╕","right":"│","bottomRight":"╛","bottom":"═","bottomLeft":"╘","left":"│"} | 
 | round | Object | {"topLeft":"╭","top":"─","topRight":"╮","right":"│","bottomRight":"╯","bottom":"─","bottomLeft":"╰","left":"│"} | 
 | single | Object | {"topLeft":"┌","top":"─","topRight":"┐","right":"│","bottomRight":"┘","bottom":"─","bottomLeft":"└","left":"│"} | 
 | singleDouble | Object | {"topLeft":"╓","top":"─","topRight":"╖","right":"║","bottomRight":"╜","bottom":"─","bottomLeft":"╙","left":"║"} | 

### [cache](./lib/cache.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | ioredis | 
 | default | AsyncFunction | options | 
 | del | AsyncFunction |  | 
 | get | AsyncFunction |  | 
 | init | AsyncFunction | options | 
 | set | AsyncFunction | key, value, options | 
 | setEx | AsyncFunction | key, value, ttl, options | 

### [callosum](./lib/callosum.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | assign | Function | key, val, o | 
 | boardcast | Function | action, data | 
 | del | Function | k, s, o | 
 | end | AsyncFunction |  | 
 | engage | Function | worker, action, data | 
 | get | AsyncFunction | ...key | 
 | getListeners | Function | i | 
 | ignore | Function | i | 
 | init | AsyncFunction | options | 
 | isPrimary | Boolean | true | 
 | isWorker | Boolean | false | 
 | on | Function | action, callback, options | 
 | once | Function | action, cbf, opts | 
 | push | Function | key, val, o | 
 | queue | Function | key, val, o | 
 | report | Function | action, data | 
 | set | AsyncFunction | key, value, options | 
 | unshift | Function | key, val, o | 
 | worker | Undefined |  | 
 | workers | Object | {} | 

### [color](./lib/color.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [dbio](./lib/dbio.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | mysql2 | 
 | default | AsyncFunction | options | 
 | assembleInsert | Function | table, data, options | 
 | assembleQuery | Function | table, options | 
 | assembleSet | Function | data, options | 
 | assembleTail | Function | options | 
 | assembleUpdate | Function | table, data, options | 
 | countAll | AsyncFunction | table | 
 | countByKeyValue | AsyncFunction | table, key, value | 
 | deleteAll | AsyncFunction | table, options | 
 | deleteById | Function | table, id, options | 
 | deleteByKeyValue | AsyncFunction | table, key, value, options | 
 | desc | AsyncFunction | table, options | 
 | drop | AsyncFunction | table, options | 
 | end | AsyncFunction | options | 
 | execute | AsyncFunction | ...args | 
 | indexes | AsyncFunction | table, options | 
 | init | AsyncFunction | options | 
 | insert | AsyncFunction | table, fields, options | 
 | query | AsyncFunction | ...args | 
 | queryAll | Function | table, options | 
 | queryById | AsyncFunction | table, id, options | 
 | queryByKeyValue | AsyncFunction | table, key, value, options | 
 | queryOne | AsyncFunction | ...args | 
 | rawAssembleKeyValue | Function | key, value, options | 
 | rawExecute | AsyncFunction | ...args | 
 | rawQuery | AsyncFunction | ...args | 
 | tables | AsyncFunction | options | 
 | updateById | AsyncFunction | table, id, fields, options | 
 | updateByKeyValue | AsyncFunction | table, key, value, fields, options | 
 | upsert | Function | table, fields, options | 

### [email](./lib/email.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | form-data,mailgun.js,node-mailjet | 
 | default | AsyncFunction | options | 
 | getSenderName | Function |  | 
 | init | AsyncFunction | options | 
 | rawSend | AsyncFunction | data | 
 | send | AsyncFunction | email, subject, text, html, args, options | 

### [encryption](./lib/encryption.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | defaultAlgorithm | String | sha256 | 
 | digestObject | Function | object, algorithm | 
 | getApiKeyCredentials | AsyncFunction | options | 
 | getSortedQueryString | Function | obj | 
 | hash | Function | string, algorithm | 
 | hashFile | Function | filename, algorithm | 
 | hexToBigInt | Function | hex | 
 | md5 | Function | string | 
 | random | Function | size, callback | 
 | randomString | Function | length, encoding | 
 | sha256 | Function | string, algorithm | 
 | sha256File | Function | filename, algorithm | 
 | uniqueString | Function | any | 

### [event](./lib/event.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | func, interval, tout, delay, name, options | 
 | bulk | AsyncFunction | absDir, options | 
 | end | AsyncFunction | name | 
 | list | Function |  | 
 | load | AsyncFunction | module, options | 
 | loop | AsyncFunction | func, interval, tout, delay, name, options | 

### [hal](./lib/hal.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @waylaidwanderer/chatgpt-api | 
 | default | AsyncFunction |  | 
 | MAX_CONTEXT_TOKENS | Number | 8192 | 
 | MAX_PROMPT_TOKENS | Number | 4915 | 
 | MAX_RESPONSE_TOKENS | Number | 3277 | 
 | countTokens | Function | txt | 
 | init | AsyncFunction |  | 

### [horizon](./lib/horizon.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [memory](./lib/memory.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | del | AsyncFunction | key, options | 
 | get | AsyncFunction | key, options | 
 | init | AsyncFunction |  | 
 | set | AsyncFunction | key, value, options | 

### [network](./lib/network.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | fast-geoip,ping | 
 | getCurrentPosition | AsyncFunction |  | 
 | httping | AsyncFunction | url, options | 
 | isLocalhost | Function | host | 
 | pickFastestHost | AsyncFunction | hosts, options | 
 | pickFastestHttpServer | AsyncFunction | urls, options | 
 | ping | AsyncFunction | host, options | 

### [sentinel](./lib/sentinel.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @sentry/node | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 

### [shekel](./lib/shekel.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | getExchangeRate | AsyncFunction | to, from, amount | 

### [shell](./lib/shell.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | command, options | 
 | assertExist | AsyncFunction | bin, er, code | 
 | exec | AsyncFunction | command, options | 
 | exist | Function | bin | 
 | which | AsyncFunction | bin | 

### [shot](./lib/shot.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | url, options | 
 | checkVersion | AsyncFunction | pack | 
 | get | AsyncFunction | url, options | 
 | getCurrentIp | AsyncFunction | options | 
 | getCurrentPosition | AsyncFunction |  | 
 | getJson | AsyncFunction | u, o | 
 | getParsedHtml | AsyncFunction | u, o | 
 | getVersionOnNpm | AsyncFunction | packName | 

### [sms](./lib/sms.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | twilio,telesignsdk | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 
 | send | AsyncFunction | to, body | 

### [speech](./lib/speech.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @google-cloud/speech,@google-cloud/text-to-speech,whisper-node | 
 | default | AsyncFunction | options | 
 | googleStt | AsyncFunction | audio, options | 
 | init | AsyncFunction | options | 
 | stt | AsyncFunction | audio, options | 
 | tts | AsyncFunction | text, options | 

### [ssl](./lib/ssl.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | acme-client | 
 | default | AsyncFunction | domain, options | 
 | createCsr | AsyncFunction | commonName, forge | 
 | ensureCert | AsyncFunction | domain, challengeCreate, challengeRemove, options | 
 | getCert | AsyncFunction |  | 
 | init | AsyncFunction | domain, options | 
 | isLocalhost | Function | host | 

### [storage](./lib/storage.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | assertPath | AsyncFunction | path, type, mode, msg, code, options | 
 | encodeBase64DataURL | Function | mime, buffer | 
 | exists | AsyncFunction | filename | 
 | getConfig | AsyncFunction | options | 
 | getConfigFilename | AsyncFunction | options | 
 | getTempPath | Function | options | 
 | handleError | Function | err, opts | 
 | input | AsyncFunction | any, options | 
 | isTextFile | AsyncFunction | file, options | 
 | legalFilename | Function | filename | 
 | mapFilename | Function | name | 
 | readFile | AsyncFunction | name, options | 
 | readJson | AsyncFunction | filename, options | 
 | setConfig | AsyncFunction | data, options | 
 | touchPath | AsyncFunction | path, options | 
 | writeFile | AsyncFunction | filename, data, options | 
 | writeJson | AsyncFunction | filename, data, options | 
 | writeTempFile | AsyncFunction | data, options | 

### [style](./lib/style.cjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {"reset":[],"bold":[],"dim":[],"italic":[],"underline":[],"inverse":[],"hidden":[],"strikethrough":[],"black":[],"red":[],"green":[],"yellow":[],"blue":[],"magenta":[],"cyan":[],"white":[],"gray":[],"grey":[],"brightRed":[],"brightGreen":[],"brightYellow":[],"brightBlue":[],"brightMagenta":[],"brightCyan":[],"brightWhite":[],"bgBlack":[],"bgRed":[],"bgGreen":[],"bgYellow":[],"bgBlue":[],"bgMagenta":[],"bgCyan":[],"bgWhite":[],"bgGray":[],"bgGrey":[],"bgBrightRed":[],"bgBrightGreen":[],"bgBrightYellow":[],"bgBrightBlue":[],"bgBrightMagenta":[],"bgBrightCyan":[],"bgBrightWhite":[],"blackBG":[],"redBG":[],"greenBG":[],"yellowBG":[],"blueBG":[],"magentaBG":[],"cyanBG":[],"whiteBG":[]} | 

### [tape](./lib/tape.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | addChatId | Function | id | 
 | end | AsyncFunction |  | 
 | init | AsyncFunction | options | 
 | removeChatId | Function | id | 

### [uoid](./lib/uoid.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Function | options | 
 | bigIntToUuid | Function |  | 
 | compactUuid | Function | str | 
 | create | Function | options | 
 | expandUuid | Function |  | 
 | fakeUuid | Function | any | 
 | getRfcUrlNamespaceUuid | Function | url | 
 | getTimestampFromUuid | Function | uuid | 
 | getUuidForCurrentHost | Function | any | 
 | rotateUuid | Function | any, step, options | 
 | uuidRegTxt | String | [0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12} | 
 | uuidToBigInt | Function | str | 

### [utilitas](./lib/utilitas.mjs)

 | symbol | type | params / value | 
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
 | call | Function | f, ...a | 
 | checkInterval | Function | itv, sed | 
 | clarify | Function |  | 
 | clone | Function | any | 
 | convertBase | Function | ipt, from, to | 
 | convertFrom16to10 | Function | ipt | 
 | countKeys | Function | any | 
 | deepCleanBigInt | Function | any, func | 
 | distill | Function | any, strict | 
 | ensureArray | Function | any | 
 | ensureDate | Function | dt, options | 
 | ensureInt | Function | any, options | 
 | ensureLines | Function | any, op | 
 | ensureString | Function | str, options | 
 | escapeHtml | Function |  | 
 | exclude | Function | obj, keys | 
 | extError | Function | err, status, opt | 
 | extract | Function | ...path | 
 | fileURLToPath | Function | path | 
 | fullLengthLog | Function | string, options | 
 | getDateByUnixTimestamp | Function | timestamp | 
 | getFuncParams | Function | func | 
 | getItemFromStringOrArray | Function | any | 
 | getKeyByValue | Function | object, value | 
 | getRandomIndexInArray | Function | array, options | 
 | getRandomInt | Function | max | 
 | getRandomItemInArray | Function | array, options | 
 | getShortestInArray | Function | arr | 
 | getType | Function | any | 
 | getUnixTimestampByDate | Function | date | 
 | hexDecode | Function | string, toBuf | 
 | hexEncode | Function | object, isBuf | 
 | humanReadableBoolean | Function | ensureString(any | 
 | ignoreErrFunc | AsyncFunction | func, options | 
 | inBrowser | Function |  | 
 | insensitiveCompare | Function | strA, strB, options | 
 | insensitiveHas | Function | list, srt, options | 
 | is | Function | type, any | 
 | isAscii | Function | str | 
 | isModule | Function | module | 
 | isNull | Function | object | 
 | isSet | Function | o, strict | 
 | isUndefined | Function | any | 
 | lineSplit | Function | string, options | 
 | locate | AsyncFunction | rootPack | 
 | log | Function | content, filename, options | 
 | makeStringByLength | Function | string, length | 
 | mapKeys | Function | any, map, strict, path | 
 | mask | Function | str, options | 
 | matchVersion | Function | curVer, tgtVer | 
 | mergeAtoB | Function | objA, objB, o | 
 | need | AsyncFunction | name, options | 
 | newError | Function | msg, status, opt | 
 | once | Function | fn, context | 
 | parseJson | Function | any, fallback | 
 | parseVersion | Function | verstr | 
 | prettyJson | Function | object, opt | 
 | purgeEmoji | Function | any, replace | 
 | randomArray | Function | array | 
 | range | Function | from, to, options | 
 | renderBox | Function | content, options | 
 | renderCode | Function | code, options | 
 | renderObject | Function | obj, options | 
 | renderText | Function | text, options | 
 | resolve | AsyncFunction | resp | 
 | rotate | Function | any, step, opts | 
 | shiftTime | Function | dif, base | 
 | split | Function | str, options | 
 | splitArgs | Function |  | 
 | supportAnsiColor | Function |  | 
 | throwError | Function | msg, status, opt | 
 | timeout | Function |  | 
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

### [vision](./lib/vision.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @google-cloud/vision | 
 | annotateImage | AsyncFunction | image, options | 
 | init | AsyncFunction | options | 
 | ocrImage | AsyncFunction | image, options | 
 | read | AsyncFunction | image, options | 
 | see | AsyncFunction | image, options | 

### [web](./lib/web.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @mozilla/readability,jsdom,youtube-transcript | 
 | assertYoutubeUrl | Function |  | 
 | distill | AsyncFunction |  | 
 | distillHtml | AsyncFunction | html, options | 
 | distillPage | AsyncFunction | url, op | 
 | distillYoutube | AsyncFunction |  | 
 | getYoutubeMetadata | AsyncFunction |  | 
 | getYoutubeTranscript | AsyncFunction |  | 
 | isYoutubeUrl | Function |  | 
