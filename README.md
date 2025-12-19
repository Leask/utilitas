# 🧰 utilitas

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node.js Package](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml)

Just another common utility for JavaScript.

Works in Node.js and modern browsers.

## Projects developed using `utilitas`

- [🤖️ halbot](https://github.com/Leask/halbot)
- [🧱 Socratex](https://github.com/Leask/socratex)
- [🛰️ `S`tar`L`ink `S`ignal `S`tatus](https://github.com/Leask/Starlink-Signal-Status)
- [🎸 webjam](https://github.com/Leask/webjam)
- [`t>` Tabminal](https://github.com/Leask/tabminal)

## APIs

### [alan](./lib/alan.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | OpenAI,@google/genai | 
 | default | AsyncFunction | options | 
 | CLOUD_OPUS_45 | String | claude-opus-4.5 | 
 | CODE_INTERPRETER | Object | {"type":"code_interpreter"} | 
 | DEEPSEEK_32 | String | deepseek-3.2-speciale | 
 | FEATURE_ICONS | Object | {"audio":"🔊","deepsearch":"🔍","fast":"⚡️","hearing":"👂","hidden":"🙈","image":"🎨","json":"📊","reasoning":"🧠","tools":"🧰","video":"🎬","vision":"👁️"} | 
 | FUNCTION | Object | {"type":"function"} | 
 | GEMINI_25_FLASH_TTS | String | gemini-2.5-flash-preview-tts | 
 | GEMINI_25_PRO_TTS | String | gemini-2.5-pro-tts | 
 | GEMINI_30_FLASH | String | gemini-3-flash-preview | 
 | GEMINI_30_PRO_IMAGE | String | gemini-3-pro-image-preview | 
 | GPT_52 | String | gpt-5.2 | 
 | GPT_5_IMAGE | String | gpt-5-image | 
 | IMAGEN_4_ULTRA | String | imagen-4.0-ultra-generate-001 | 
 | OPENAI_VOICE | String | OPENAI_VOICE | 
 | RETRIEVAL | Object | {"type":"retrieval"} | 
 | TOP | String | top | 
 | VEO_31 | String | veo-3.1-generate-preview | 
 | _NO_RENDER | Array | INSTRUCTIONS,MODELS,DEFAULT_MODELS | 
 | analyzeSessions | AsyncFunction | sessionIds, options | 
 | countTokens | Function | input | 
 | distillFile | AsyncFunction | attachments, o | 
 | getAi | AsyncFunction | id, options | 
 | getChatAttachmentCost | AsyncFunction | options | 
 | getChatPromptLimit | AsyncFunction | options | 
 | getSession | AsyncFunction | sessionId, options | 
 | init | AsyncFunction | options | 
 | initChat | AsyncFunction | options | 
 | joinL1 | Function |  | 
 | joinL2 | Function |  | 
 | k | Function |  | 
 | listOpenAIModels | AsyncFunction | aiId, options | 
 | prompt | AsyncFunction | input, options | 
 | promptOpenRouter | AsyncFunction | aiId, content, options | 
 | resetSession | AsyncFunction | sessionId, options | 
 | setSession | AsyncFunction | sessionId, session, options | 
 | stt | AsyncFunction | audio, options | 
 | talk | AsyncFunction | request, options | 
 | trimPrompt | Function | prompt, maxInputTokens, options | 
 | trimText | Function | text, options | 
 | tts | AsyncFunction | content, options | 

### [bee](./lib/bee.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | puppeteer | 
 | default | AsyncFunction |  | 
 | browse | AsyncFunction | url, options | 
 | end | AsyncFunction |  | 
 | init | AsyncFunction |  | 

### [bot](./lib/bot.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | telegraf | 
 | default | AsyncFunction | options | 
 | BOT | String | 🤖 | 
 | EMOJI_THINKING | String | 💬 | 
 | MESSAGE_LENGTH_LIMIT | Number | 3809 | 
 | PARSE_MODE_MD | String | Markdown | 
 | PARSE_MODE_MD_V2 | String | MarkdownV2 | 
 | end | AsyncFunction | async, options | 
 | init | AsyncFunction | options | 
 | lines | Function | arr, sep | 
 | parse_mode | String | Markdown | 
 | send | AsyncFunction | chatId, content, options | 
 | sendMd | Function | cId, cnt, opt | 

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
 | end | AsyncFunction |  | 
 | get | AsyncFunction |  | 
 | init | AsyncFunction | options | 
 | set | AsyncFunction | key, value, options | 
 | setEx | AsyncFunction | key, value, ttl, options | 

### [callosum](./lib/callosum.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | options | 
 | assertFunc | Function |  | 
 | assign | Function | k, v, o | 
 | boardcast | Function | action, data | 
 | call | AsyncFunction | func, options | 
 | del | Function | k, s, o | 
 | delKey | AsyncFunction | args, options | 
 | end | AsyncFunction |  | 
 | engage | Function | worker, action, data | 
 | flush | AsyncFunction | k, o | 
 | get | AsyncFunction | ...args | 
 | getFunc | Function | name, options | 
 | getListeners | Function | i | 
 | ignore | Function | i | 
 | init | AsyncFunction | options | 
 | isPrimary | Boolean | true | 
 | isWorker | Boolean | false | 
 | on | Function | action, callback, options | 
 | once | Function | action, cbf, opts | 
 | pop | AsyncFunction | k, o | 
 | push | Function | k, v, o | 
 | queue | Function | k, v, o | 
 | register | Function | name, func, options | 
 | report | Function | action, data | 
 | set | AsyncFunction | key, value, options | 
 | shift | AsyncFunction | k, o | 
 | unregister | Function | name | 
 | unshift | Function | k, v, o | 
 | worker | Undefined |  | 
 | workers | Object | {} | 

### [color](./lib/color.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [dbio](./lib/dbio.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | mysql2,pg | 
 | default | AsyncFunction | options | 
 | MYSQL | String | MYSQL | 
 | POSTGRESQL | String | POSTGRESQL | 
 | assembleInsert | Function | table, data, options | 
 | assembleQuery | Function | table, options | 
 | assembleSet | Function | data, options | 
 | assembleTail | Function | options | 
 | assembleUpdate | Function | table, data, options | 
 | cleanSql | Function | sql | 
 | countAll | AsyncFunction | table | 
 | countByKeyValue | AsyncFunction | table, key, value | 
 | deleteAll | AsyncFunction | table, options | 
 | deleteById | AsyncFunction | table, id, options | 
 | deleteByKeyValue | AsyncFunction | table, key, value, options | 
 | desc | AsyncFunction | table, options | 
 | drop | AsyncFunction | table, options | 
 | enableVector | AsyncFunction |  | 
 | encodeVector | AsyncFunction |  | 
 | end | AsyncFunction | options | 
 | execute | AsyncFunction | ...args | 
 | getPgvector | AsyncFunction |  | 
 | getProvider | AsyncFunction |  | 
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
 | vacuum | AsyncFunction | table, options | 

### [email](./lib/email.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | form-data,mailgun.js,mailparser,node-mailjet | 
 | default | AsyncFunction | options | 
 | getSenderName | Function |  | 
 | init | AsyncFunction | options | 
 | parse | AsyncFunction | input, options | 
 | rawSend | AsyncFunction | data | 
 | send | AsyncFunction | email, subject, text, html, args, options | 

### [encryption](./lib/encryption.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | google-gax | 
 | aesCreateIv | Function | options | 
 | aesCreateKey | Function | options | 
 | aesDecrypt | Function | any, options | 
 | aesEncrypt | Function | any, options | 
 | defaultAlgorithm | String | sha256 | 
 | defaultEncryption | String | aes-256-gcm | 
 | digestObject | Function | object, algorithm | 
 | getGoogleAuthByCredentials | AsyncFunction | keyFilename | 
 | getGoogleAuthTokenByAuth | AsyncFunction | auth | 
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

### [horizon](./lib/horizon.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [media](./lib/media.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | fluent-ffmpeg,@ffmpeg-installer/ffmpeg,@ffprobe-installer/ffprobe | 
 | convertAudioTo16kNanoOpusOgg | Function | input, options | 
 | convertAudioTo16kNanoPcmWave | Function | input, options | 
 | createWavHeader | Function | dataSize, sampleRate, numChannels, bitsPerSample | 
 | getFfmpeg | AsyncFunction | options | 
 | packPcmToWav | AsyncFunction | audio, options | 

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

### [rag](./lib/rag.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | openai,@google-cloud/discoveryengine | 
 | embed | AsyncFunction | input, options | 
 | initEmbedding | AsyncFunction | options | 
 | initReranker | AsyncFunction | options | 
 | rerank | AsyncFunction | query, records, options | 

### [sentinel](./lib/sentinel.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @sentry/node,@sentry/profiling-node | 
 | default | AsyncFunction | options | 
 | init | AsyncFunction | options | 

### [shell](./lib/shell.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | AsyncFunction | command, options | 
 | assertExist | AsyncFunction | bin, er, code | 
 | exec | AsyncFunction | command, options | 
 | exist | Function | bin | 
 | which | AsyncFunction | bin | 

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
 | _NEED | Array | whisper-node | 
 | checkSay | AsyncFunction |  | 
 | checkWhisper | AsyncFunction |  | 
 | stt | AsyncFunction | audio, options | 
 | sttWhisper | AsyncFunction | audio, options | 
 | tts | AsyncFunction | text, options | 
 | ttsSay | AsyncFunction | text, options | 

### [ssl](./lib/ssl.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | acme-client | 
 | default | AsyncFunction | domain, options | 
 | SSL_RESET | String | SSL_RESET | 
 | createCsr | AsyncFunction | commonName, forge | 
 | ensureCert | AsyncFunction | domain, challengeCreate, challengeRemove, options | 
 | getCert | AsyncFunction | name | 
 | httpsServerOptions | AsyncFunction | options | 
 | init | AsyncFunction | domain, options | 
 | isLocalhost | Function | host | 

### [storage](./lib/storage.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | file-type,mime-types,@google-cloud/storage | 
 | BASE64 | String | BASE64 | 
 | BUFFER | String | BUFFER | 
 | DATAURL | String | DATAURL | 
 | FILE | String | FILE | 
 | MIME_AAC | String | audio/aac | 
 | MIME_AVI | String | video/avi | 
 | MIME_BINARY | String | application/octet-stream | 
 | MIME_FLAC | String | audio/flac | 
 | MIME_FLV | String | video/x-flv | 
 | MIME_GIF | String | image/gif | 
 | MIME_JPEG | String | image/jpeg | 
 | MIME_JSON | String | application/json | 
 | MIME_M4A | String | audio/m4a | 
 | MIME_MOV | String | video/mov | 
 | MIME_MP3 | String | audio/mp3 | 
 | MIME_MP4 | String | video/mp4 | 
 | MIME_MPEG | String | video/mpeg | 
 | MIME_MPEGA | String | audio/mpeg | 
 | MIME_MPEGPS | String | video/mpegps | 
 | MIME_MPG | String | video/mpg | 
 | MIME_MPGA | String | audio/mpga | 
 | MIME_OGG | String | audio/ogg | 
 | MIME_OPUS | String | audio/opus | 
 | MIME_PCM | String | audio/pcm | 
 | MIME_PCM16 | String | audio/x-wav | 
 | MIME_PDF | String | application/pdf | 
 | MIME_PNG | String | image/png | 
 | MIME_TEXT | String | text/plain | 
 | MIME_TGPP | String | video/3gpp | 
 | MIME_WAV | String | audio/wav | 
 | MIME_WEBM | String | audio/webm | 
 | MIME_WEBP | String | image/webp | 
 | MIME_WMV | String | video/wmv | 
 | STREAM | String | STREAM | 
 | analyzeFile | AsyncFunction | any, options | 
 | assertPath | AsyncFunction | path, type, mode, msg, code, options | 
 | blobToBuffer | AsyncFunction |  | 
 | convert | AsyncFunction | any, options | 
 | decodeBase64DataURL | Function |  | 
 | deleteFileOnCloud | AsyncFunction | path, options | 
 | deleteOnCloud | AsyncFunction | path, options | 
 | downloadFileFromCloud | AsyncFunction | path, options | 
 | downloadFromCloud | AsyncFunction | path, options | 
 | encodeBase64DataURL | AsyncFunction | mime, buffer | 
 | exists | AsyncFunction | filename | 
 | existsOnCloud | AsyncFunction | destination, options | 
 | formatDataURL | Function | mt, b64 | 
 | getConfig | AsyncFunction | options | 
 | getConfigFilename | AsyncFunction | options | 
 | getGcUrlByBucket | Function | bucke | 
 | getIdByGs | Function | gs | 
 | getMime | AsyncFunction | buf, filename | 
 | getTempPath | Function | options | 
 | handleError | Function | err, opts | 
 | init | AsyncFunction | options | 
 | isTextFile | AsyncFunction | file, options | 
 | legalFilename | Function | filename | 
 | lsOnCloud | AsyncFunction | prefix, options | 
 | mapFilename | Function |  | 
 | mergeFile | AsyncFunction | data, options | 
 | readFile | AsyncFunction | name, options | 
 | readJson | AsyncFunction | filename, options | 
 | sanitizeFilename | Function | s, r | 
 | setConfig | AsyncFunction | data, options | 
 | sliceFile | AsyncFunction | any, options | 
 | touchPath | AsyncFunction | path, options | 
 | tryRm | AsyncFunction | path, options | 
 | unzip | AsyncFunction | any, options | 
 | uploadToCloud | AsyncFunction | data, options | 
 | writeFile | AsyncFunction | filename, data, options | 
 | writeJson | AsyncFunction | filename, data, options | 
 | writeTempFile | AsyncFunction | data, options | 
 | zip | AsyncFunction | any, options | 

### [style](./lib/style.cjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {"reset":[],"bold":[],"dim":[],"italic":[],"underline":[],"inverse":[],"hidden":[],"strikethrough":[],"black":[],"red":[],"green":[],"yellow":[],"blue":[],"magenta":[],"cyan":[],"white":[],"gray":[],"grey":[],"brightRed":[],"brightGreen":[],"brightYellow":[],"brightBlue":[],"brightMagenta":[],"brightCyan":[],"brightWhite":[],"bgBlack":[],"bgRed":[],"bgGreen":[],"bgYellow":[],"bgBlue":[],"bgMagenta":[],"bgCyan":[],"bgWhite":[],"bgGray":[],"bgGrey":[],"bgBrightRed":[],"bgBrightGreen":[],"bgBrightYellow":[],"bgBrightBlue":[],"bgBrightMagenta":[],"bgBrightCyan":[],"bgBrightWhite":[],"blackBG":[],"redBG":[],"greenBG":[],"yellowBG":[],"blueBG":[],"magentaBG":[],"cyanBG":[],"whiteBG":[]} | 
 | module.exports | Object | {"reset":[],"bold":[],"dim":[],"italic":[],"underline":[],"inverse":[],"hidden":[],"strikethrough":[],"black":[],"red":[],"green":[],"yellow":[],"blue":[],"magenta":[],"cyan":[],"white":[],"gray":[],"grey":[],"brightRed":[],"brightGreen":[],"brightYellow":[],"brightBlue":[],"brightMagenta":[],"brightCyan":[],"brightWhite":[],"bgBlack":[],"bgRed":[],"bgGreen":[],"bgYellow":[],"bgBlue":[],"bgMagenta":[],"bgCyan":[],"bgWhite":[],"bgGray":[],"bgGrey":[],"bgBrightRed":[],"bgBrightGreen":[],"bgBrightYellow":[],"bgBrightBlue":[],"bgBrightMagenta":[],"bgBrightCyan":[],"bgBrightWhite":[],"blackBG":[],"redBG":[],"greenBG":[],"yellowBG":[],"blueBG":[],"magentaBG":[],"cyanBG":[],"whiteBG":[]} | 

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
 | assembleBuffer | Function |  | 
 | assembleUrl | Function | url, componens | 
 | assertArray | Function | arr, message, status, opts | 
 | assertBuffer | Function | buffer, message, status, options | 
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
 | basename | Function |  | 
 | byteToHexString | Function | byteArray | 
 | call | Function | f, ...a | 
 | checkChance | Function |  | 
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
 | fileURLToPath | Function | path, options | 
 | fullLengthLog | Function | string, options | 
 | getDateByUnixTimestamp | Function | timestamp | 
 | getFuncParams | Function | func | 
 | getItemFromStringOrArray | Function | any | 
 | getKeyByValue | Function | object, value | 
 | getRandomIndexInArray | Function | array, options | 
 | getRandomInt | Function |  | 
 | getRandomItemInArray | Function | array, options | 
 | getShortestInArray | Function | arr | 
 | getTimeIcon | Function | objTime | 
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
 | isModule | Function | module, module | 
 | isNull | Function | object, object | 
 | isSet | Function | o, strict | 
 | isUndefined | Function | any, any | 
 | lastItem | Function | array | 
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
 | parseJson | Function | any, fallback, options | 
 | parseVersion | Function | verstr | 
 | prettyJson | Function | object, opt | 
 | purgeEmoji | Function | any, replace | 
 | randomArray | Function | array | 
 | range | Function | from, to, options | 
 | renderBox | Function | content, options | 
 | renderCode | Function | code, options | 
 | renderObject | Function | obj, options | 
 | renderText | Function | text, options | 
 | resolve | AsyncFunction | async, res | 
 | reverseKeyValues | Function |  | 
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
 | uptime | Function |  | 
 | verifyEmail | Function | any | 
 | verifyPhone | Function | phone | 
 | verifyUrl | Function | url | 
 | verifyUuid | Function | uuid | 
 | voidFunc | Function |  | 
 | which | AsyncFunction | any | 

### [vision](./lib/vision.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | office-text-extractor,pdfjs-dist,pdf-lib,tesseract.js | 
 | default | AsyncFunction | options | 
 | getPdfInfo | AsyncFunction | file, options | 
 | getPdfPage | AsyncFunction | doc, pages | 
 | init | AsyncFunction | options | 
 | ocr | AsyncFunction | file, options | 
 | ocrImage | AsyncFunction | image, options | 
 | parseOfficeFile | AsyncFunction | source, options | 
 | splitPdf | AsyncFunction | file, options | 

### [web](./lib/web.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | jsdom,youtube-transcript,@mozilla/readability | 
 | default | AsyncFunction | url, options | 
 | assertYoutubeUrl | Function |  | 
 | checkSearch | Function |  | 
 | checkVersion | AsyncFunction | pack | 
 | distill | AsyncFunction | url, options | 
 | distillHtml | AsyncFunction | input, options | 
 | distillPage | AsyncFunction | url, op | 
 | distillYoutube | AsyncFunction |  | 
 | get | AsyncFunction | url, options | 
 | getCurrentIp | AsyncFunction | options | 
 | getCurrentPosition | AsyncFunction |  | 
 | getExchangeRate | AsyncFunction | to, from, amount | 
 | getJson | AsyncFunction | u, o | 
 | getParsedHtml | AsyncFunction | u, o | 
 | getVersionOnNpm | AsyncFunction | packName | 
 | getYoutubeMetadata | AsyncFunction |  | 
 | getYoutubeTranscript | AsyncFunction |  | 
 | initDistill | AsyncFunction | options | 
 | initSearch | AsyncFunction | options | 
 | isYoutubeUrl | Function |  | 
 | search | AsyncFunction | query, options | 
