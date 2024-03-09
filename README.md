# 🧰 utilitas

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node.js Package](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml)

Just another common utility for JavaScript.

Works in Node.js and modern browsers.

## Projects developed using `utilitas`

- [🤖️ halbot](https://github.com/Leask/halbot)
- [Socratex](https://github.com/Leask/socratex)
- [`S`tar`L`ink `S`ignal `S`tatus 🛰️](https://github.com/Leask/Starlink-Signal-Status)
- [🎸 webjam](https://github.com/Leask/webjam)

## APIs

### [alan](./lib/alan.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @google-cloud/aiplatform,@google-cloud/vertexai,@google/generative-ai,js-tiktoken,ollama,OpenAI | 
 | default | AsyncFunction | options | 
 | CODE_INTERPRETER | Object | {"type":"code_interpreter"} | 
 | DEFAULT_MODELS | Object | {"ASSISTANT":"gpt-3.5-turbo","CHATGPT":"gpt-3.5-turbo","GEMINI_EMEDDING":"embedding-001","GEMINI":"gemini-pro","OLLAMA":"mistral","OPENAI_EMBEDDING":"text-embedding-3-small","OPENAI_TRAINING":"gpt-3.5-turbo-1106","VERTEX_EMEDDING":"textembedding-gecko-multilingual@001","VERTEX":"gemini-pro-vision"} | 
 | EMBEDDING_001 | String | embedding-001 | 
 | EMBEDDING_GECKO_001 | String | textembedding-gecko@001 | 
 | EMBEDDING_GECKO_002 | String | textembedding-gecko@002 | 
 | EMBEDDING_GECKO_ML001 | String | textembedding-gecko-multilingual@001 | 
 | FUNCTION | Object | {"type":"function"} | 
 | GEMINI_PRO | String | gemini-pro | 
 | GEMINI_PRO_VISION | String | gemini-pro-vision | 
 | GPT_35_TURBO | String | gpt-3.5-turbo | 
 | GPT_35_TURBO_16K | String | gpt-3.5-turbo-1106 | 
 | GPT_4 | String | gpt-4 | 
 | GPT_4_TURBO | String | gpt-4-turbo-preview | 
 | GPT_4_VISION | String | gpt-4-vision-preview | 
 | MISTRAL | String | mistral | 
 | MODELS | Object | {"gpt-3.5-turbo":{"contextWindow":4096,"tokenLimitsTPM":160000,"requestLimitsRPM":5000,"trainingData":"Sep 2021","name":"gpt-3.5-turbo","supportedMimeTypes":[],"maxOutputTokens":1639,"maxInputTokens":2457,"tokenLimitsTPD":230400000,"requestLimitsRPD":7200000,"requestCapacityRPM":66},"gpt-3.5-turbo-1106":{"contextWindow":16385,"maxOutputTokens":4096,"tokenLimitsTPM":160000,"requestLimitsRPM":5000,"trainingData":"Sep 2021","name":"gpt-3.5-turbo-1106","supportedMimeTypes":[],"maxInputTokens":12289,"tokenLimitsTPD":230400000,"requestLimitsRPD":7200000,"requestCapacityRPM":14},"gpt-4":{"contextWindow":8192,"tokenLimitsTPM":80000,"requestLimitsRPM":5000,"trainingData":"Sep 2021","name":"gpt-4","supportedMimeTypes":[],"maxOutputTokens":3277,"maxInputTokens":4915,"tokenLimitsTPD":115200000,"requestLimitsRPD":7200000,"requestCapacityRPM":17},"gpt-4-turbo-preview":{"contextWindow":128000,"maxOutputTokens":4096,"tokenLimitsTPM":300000,"tokenLimitsTPD":5000000,"requestLimitsRPM":5000,"trainingData":"Apr 2023","name":"gpt-4-turbo-preview","supportedMimeTypes":[],"maxInputTokens":123904,"requestLimitsRPD":7200000,"requestCapacityRPM":3},"gpt-4-vision-preview":{"contextWindow":128000,"maxOutputTokens":4096,"tokenLimitsTPM":40000,"requestLimitsRPM":120,"requestLimitsRPD":1500,"trainingData":"Apr 2023","vision":true,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"name":"gpt-4-vision-preview","maxInputTokens":123904,"tokenLimitsTPD":57600000,"requestCapacityRPM":1},"gemini-pro":{"contextWindow":32760,"maxOutputTokens":8192,"trainingData":"Feb 2023","name":"gemini-pro","supportedMimeTypes":[],"maxInputTokens":24568,"tokenLimitsTPD":null,"requestLimitsRPD":null,"requestCapacityRPM":null},"gemini-pro-vision":{"contextWindow":16384,"maxOutputTokens":2048,"maxImageSize":null,"maxFileSize":20971520,"maxImagePerPrompt":16,"maxVideoLength":120,"trainingData":"Feb 2023","vision":true,"supportedMimeTypes":["image/png","image/jpeg","video/mov","video/mpeg","video/mp4","video/mpg","video/avi","video/wmv","video/mpegps","video/flv"],"name":"gemini-pro-vision","maxInputTokens":14336,"tokenLimitsTPD":null,"requestLimitsRPD":null,"requestCapacityRPM":null},"mistral":{"contextWindow":128000,"tokenLimitsTPM":null,"requestLimitsRPM":null,"name":"mistral","supportedMimeTypes":[],"maxOutputTokens":51200,"maxInputTokens":76800,"tokenLimitsTPD":null,"requestLimitsRPD":null,"requestCapacityRPM":null},"text-embedding-3-small":{"contextWindow":8191,"outputDimension":1536,"tokenLimitsTPM":1000000,"requestLimitsRPM":500,"trainingData":"Sep 2021","embedding":true,"name":"text-embedding-3-small","maxInputTokens":8191},"text-embedding-3-large":{"contextWindow":8191,"outputDimension":3072,"tokenLimitsTPM":1000000,"requestLimitsRPM":500,"trainingData":"Sep 2021","embedding":true,"name":"text-embedding-3-large","maxInputTokens":8191},"GEMINI_EMEDDING":{"contextWindow":3072,"embedding":true,"name":"GEMINI_EMEDDING","maxInputTokens":3072},"VERTEX_EMEDDING":{"contextWindow":3072,"embedding":true,"name":"VERTEX_EMEDDING","maxInputTokens":3072}} | 
 | RETRIEVAL | Object | {"type":"retrieval"} | 
 | TEXT_EMBEDDING_3_SMALL | String | text-embedding-3-small | 
 | buildGptTrainingCase | Function | prompt, response, options | 
 | buildGptTrainingCases | Function | cases, opts | 
 | cancelGptFineTuningJob | AsyncFunction | job_id, options | 
 | countTokens | AsyncFunction | input, options | 
 | createAssistant | AsyncFunction | options | 
 | createGeminiEmbedding | AsyncFunction | input, options | 
 | createGptFineTuningJob | AsyncFunction | training_file, options | 
 | createMessage | AsyncFunction | threadId, content, options | 
 | createOpenAIEmbedding | AsyncFunction | input, options | 
 | createVertexEmbedding | AsyncFunction | content, options | 
 | deleteAllFilesFromAssistant | AsyncFunction | assistantId, options | 
 | deleteAssistant | AsyncFunction | assistantId, options | 
 | deleteFile | AsyncFunction | file_id, options | 
 | deleteFileFromAssistant | AsyncFunction | assistantId, file_id, options | 
 | deleteThread | AsyncFunction | threadId, options | 
 | detachFileFromAssistant | AsyncFunction | assistantId, file_id, options | 
 | ensureAssistant | AsyncFunction |  | 
 | ensureThread | AsyncFunction |  | 
 | getAssistant | AsyncFunction | assistantId, options | 
 | getGptFineTuningJob | AsyncFunction | job_id, options | 
 | getLatestMessage | AsyncFunction | threadId, options | 
 | getMaxChatPromptLimit | Function | options | 
 | getRun | AsyncFunction | threadId, runId, options | 
 | getThread | AsyncFunction | threadId, options | 
 | init | AsyncFunction | options | 
 | initChat | AsyncFunction | options | 
 | listAssistant | AsyncFunction | options | 
 | listAssistantFiles | AsyncFunction | assistant_id, options | 
 | listFiles | AsyncFunction | options | 
 | listGptFineTuningEvents | AsyncFunction | job_id, options | 
 | listGptFineTuningJobs | AsyncFunction | options | 
 | listMessages | AsyncFunction | threadId, options | 
 | listOpenAIModels | AsyncFunction | options | 
 | modifyAssistant | AsyncFunction | assistantId, assistant, options | 
 | promptAssistant | AsyncFunction | content, options | 
 | promptChatGPT | AsyncFunction | content, options | 
 | promptGemini | AsyncFunction | content, options | 
 | promptOllama | AsyncFunction | content, options | 
 | promptVertex | AsyncFunction | content, options | 
 | resetSession | AsyncFunction | sessionId, options | 
 | run | AsyncFunction | assistantId, threadId, options | 
 | tailGptFineTuningEvents | AsyncFunction | job_id, options | 
 | talk | AsyncFunction | input, options | 
 | uploadFile | AsyncFunction | input, options | 
 | uploadFileForAssistants | AsyncFunction | content, options | 
 | uploadFileForFineTuning | AsyncFunction | content, options | 
 | uploadFileForRetrieval | AsyncFunction | assistantId, content, options | 

### [bot](./lib/bot.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | telegraf | 
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
 | MESSAGE_SOFT_LIMIT | Number | 4000 | 
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
 | sendMd | Function | cId, cnt, opt | 
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
 | _NEED | Array | @google-cloud/speech,@google-cloud/text-to-speech,@google-cloud/vision,google-gax | 
 | aesCreateIv | Function | options | 
 | aesCreateKey | Function | options | 
 | aesDecrypt | Function | any, options | 
 | aesEncrypt | Function | any, options | 
 | defaultAlgorithm | String | sha256 | 
 | defaultEncryption | String | aes-256-gcm | 
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

### [horizon](./lib/horizon.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | default | Object | {} | 

### [image](./lib/image.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | OpenAI | 
 | default | AsyncFunction | options | 
 | generate | AsyncFunction | prompt, options | 
 | init | AsyncFunction | options | 

### [media](./lib/media.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | fluent-ffmpeg,@ffmpeg-installer/ffmpeg,@ffprobe-installer/ffprobe | 
 | convertAudioTo16kNanoOpusOgg | Function | input, options | 
 | convertAudioTo16kNanoPcmWave | Function | input, options | 
 | getFfmpeg | AsyncFunction | options | 

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
 | _NEED | Array | @google-cloud/speech,@google-cloud/text-to-speech,OpenAI,whisper-node | 
 | default | AsyncFunction | options | 
 | checkSay | AsyncFunction | options | 
 | checkWhisper | AsyncFunction | options | 
 | init | AsyncFunction | options | 
 | stt | AsyncFunction | audio, options | 
 | sttGoogle | AsyncFunction | audio, options | 
 | sttOpenAI | AsyncFunction | audio, options | 
 | sttWhisper | AsyncFunction | audio, options | 
 | tts | AsyncFunction | text, options | 
 | ttsGoogle | AsyncFunction | text, options | 
 | ttsOpenAI | AsyncFunction | input, options | 
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
 | analyzeFile | AsyncFunction | any, options | 
 | assertPath | AsyncFunction | path, type, mode, msg, code, options | 
 | blobToBuffer | AsyncFunction |  | 
 | convert | AsyncFunction | any, options | 
 | decodeBase64DataURL | Function |  | 
 | deleteFileOnCloud | AsyncFunction | path, options | 
 | deleteOnCloud | AsyncFunction | path, options | 
 | downloadFileFromCloud | AsyncFunction | path, options | 
 | downloadFromCloud | AsyncFunction | path, options | 
 | encodeBase64DataURL | Function | mime, buffer | 
 | exists | AsyncFunction | filename | 
 | existsOnCloud | AsyncFunction | destination, options | 
 | getConfig | AsyncFunction | options | 
 | getConfigFilename | AsyncFunction | options | 
 | getGcUrlByBucket | Function | bucke | 
 | getIdByGs | Function | gs | 
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
 | voidFunc | Function |  | 
 | which | AsyncFunction | any | 

### [vision](./lib/vision.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | @google-cloud/vision,office-text-extractor,pdfjs-dist,tesseract.js | 
 | annotateImage | AsyncFunction | image, options | 
 | getPdfInfo | AsyncFunction | file, options | 
 | getPdfPage | AsyncFunction | doc, pageNum | 
 | getPdfPages | AsyncFunction | doc | 
 | init | AsyncFunction | options | 
 | ocrImage | AsyncFunction | image, options | 
 | ocrImageGoogle | AsyncFunction | image, options | 
 | ocrImageTesseract | AsyncFunction | image, options | 
 | parseOfficeFile | AsyncFunction | source, options | 
 | read | AsyncFunction | image, options | 
 | readAll | AsyncFunction | image, options | 
 | see | AsyncFunction | image, options | 

### [web](./lib/web.mjs)

 | symbol | type | params / value | 
 | :--- | :--- | :--- | 
 | _NEED | Array | jsdom,youtube-transcript,@mozilla/readability,@ngrok/ngrok | 
 | assertYoutubeUrl | Function |  | 
 | distill | AsyncFunction |  | 
 | distillHtml | AsyncFunction | input, options | 
 | distillPage | AsyncFunction | url, op | 
 | distillYoutube | AsyncFunction |  | 
 | forward | AsyncFunction | options | 
 | getYoutubeMetadata | AsyncFunction |  | 
 | getYoutubeTranscript | AsyncFunction |  | 
 | isYoutubeUrl | Function |  | 
