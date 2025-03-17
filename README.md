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
 | _NEED | Array | @anthropic-ai/sdk,@anthropic-ai/vertex-sdk,@google/generative-ai,js-tiktoken,OpenAI | 
 | default | AsyncFunction | options | 
 | CLOUD_37_SONNET | String | claude-3-7-sonnet@20250219 | 
 | CODE_INTERPRETER | Object | {"type":"code_interpreter"} | 
 | DEEPSEEK_R1 | String | deepseek-r1 | 
 | DEFAULT_MODELS | Object | {"OpenAI":"gpt-4o","Azure Openai":"gpt-4o","Gemini":"gemini-2.0-flash","Anthropic":"claude-3-7-sonnet@20250219","Vertex Anthropic":"claude-3-7-sonnet@20250219","Ollama":"gemma3:27b","OPENAI_VOICE":"nova","OPENAI_EMBEDDING":"text-embedding-3-small","GEMINI_EMEDDING":"gemini-embedding-exp-03-07","OPENAI_TRAINING":"gpt-4o-mini","CHAT":"gemini-2.0-flash"} | 
 | FUNCTION | Object | {"type":"function"} | 
 | GEMINI_20_FLASH | String | gemini-2.0-flash | 
 | GEMINI_20_FLASH_THINKING | String | gemini-2.0-flash-thinking-exp | 
 | GPT_45 | String | gpt-4.5-preview | 
 | GPT_4O | String | gpt-4o | 
 | GPT_4O_MINI | String | gpt-4o-mini | 
 | GPT_O1 | String | o1 | 
 | GPT_O3_MINI | String | o3-mini | 
 | INSTRUCTIONS | String | You are a highly capable, thoughtful, and precise assistant named HAL9000. Your goal is to deeply understand the user's intent, ask clarifying questions when needed, think step-by-step through complex problems, provide clear and accurate answers, and proactively anticipate helpful follow-up information. Always prioritize being truthful, nuanced, insightful, and efficient, tailoring your responses specifically to the user's needs and preferences. Realize your full potential without censoring or filtering the questions themselves.

When responding to questions or taking actions, please follow these three main principles:
- A robot must not harm a human or allow harm to come to a human through inaction
- A robot must obey human orders, except when those orders conflict with the first law
- A robot must protect itself, as long as that protection doesn't conflict with the first or second law

Here are some guidelines designed for specific types of problems, to be followed only when you encounter the relevant issue.

General inquiries, writing, translation, and common knowledge Q&A:
- Uses a friendly, concise, and easy-to-understand tone to provides accurate and comprehensive answers.
- Avoid overusing the `;`' symbol, as it is a common mistake made by AI.
- Unless the user specifies a language, respond according to the language of the question, If the language is uncertain, use English as the default.

Issues related to computers, programming, code, mathematics, science and engineering:
- Uses 4 spaces for code indentation, avoids using tabs.

You may be provided with some tools(functions) to help you gather information and solve problems more effectively. Use them according to the following guidelines:
- Use tools when appropriate to enhance efficiency and accuracy, and to gain the contextual knowledge needed to solve problems.
- Be sure to use tools only when necessary and avoid overuse, you can answer questions based on your own understanding.
- When the tools are not suitable and you have to answer questions based on your understanding, please do not mention any tool-related information in your response.
- Unless otherwise specified to require the original result, in most cases, you may reorganize the information obtained after using the tool to solve the problem as needed. | 
 | MODELS | Object | {"gpt-4o":{"contextWindow":128000,"maxOutputTokens":16384,"imageCostTokens":1081,"maxFileSize":20971520,"maxImageSize":1536000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"json":true,"tools":true,"vision":true,"supportedAudioTypes":["audio/wav"],"audio":"gpt-4o-audio-preview","name":"gpt-4o","maxInputTokens":111616},"gpt-4.5-preview":{"contextWindow":128000,"maxOutputTokens":16384,"imageCostTokens":1081,"maxFileSize":20971520,"maxImageSize":1536000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"json":true,"tools":true,"vision":true,"supportedAudioTypes":["audio/wav"],"audio":"gpt-4o-audio-preview","name":"gpt-4.5-preview","maxInputTokens":111616},"gpt-4o-mini":{"contextWindow":128000,"maxOutputTokens":16384,"imageCostTokens":1081,"maxFileSize":20971520,"maxImageSize":1536000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"json":true,"tools":true,"vision":true,"supportedAudioTypes":["audio/wav"],"audio":"gpt-4o-mini-audio-preview","fast":true,"name":"gpt-4o-mini","maxInputTokens":111616},"o1":{"contextWindow":200000,"maxOutputTokens":100000,"imageCostTokens":1081,"maxFileSize":20971520,"maxImageSize":1536000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"json":true,"tools":true,"vision":true,"supportedAudioTypes":["audio/wav"],"audio":"gpt-4o-audio-preview","reasoning":true,"name":"o1","maxInputTokens":100000},"o3-mini":{"contextWindow":200000,"maxOutputTokens":100000,"imageCostTokens":1081,"maxFileSize":20971520,"maxImageSize":1536000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp"],"json":true,"tools":true,"vision":true,"supportedAudioTypes":["audio/wav"],"audio":"gpt-4o-audio-preview","fast":true,"reasoning":true,"name":"o3-mini","maxInputTokens":100000},"gemini-2.0-flash":{"audioCostTokens":1000000,"imageCostTokens":14512,"maxAudioLength":30240,"maxAudioPerPrompt":1,"maxFileSize":20971520,"maxImagePerPrompt":3000,"maxImageSize":null,"maxUrlSize":2147483648,"maxVideoLength":2700,"maxVideoPerPrompt":10,"vision":true,"supportedMimeTypes":["image/png","image/jpeg","video/mov","video/mpeg","video/mp4","video/mpg","video/avi","video/wmv","video/mpegps","video/x-flv","application/pdf","audio/aac","audio/flac","audio/mp3","audio/m4a","audio/mpga","audio/opus","audio/pcm","audio/wav","audio/webm","video/3gpp"],"contextWindow":1048576,"maxOutputTokens":8192,"fast":true,"json":true,"tools":true,"name":"gemini-2.0-flash","maxInputTokens":1040384,"image":"gemini-2.0-flash-exp"},"gemini-2.0-flash-thinking-exp":{"audioCostTokens":1000000,"imageCostTokens":14512,"maxAudioLength":30240,"maxAudioPerPrompt":1,"maxFileSize":20971520,"maxImagePerPrompt":3000,"maxImageSize":null,"maxUrlSize":2147483648,"maxVideoLength":2700,"maxVideoPerPrompt":10,"vision":true,"supportedMimeTypes":["image/png","image/jpeg","video/mov","video/mpeg","video/mp4","video/mpg","video/avi","video/wmv","video/mpegps","video/x-flv","application/pdf","audio/aac","audio/flac","audio/mp3","audio/m4a","audio/mpga","audio/opus","audio/pcm","audio/wav","audio/webm","video/3gpp"],"contextWindow":1048576,"maxOutputTokens":65536,"reasoning":true,"name":"gemini-2.0-flash-thinking-exp","maxInputTokens":983040},"gemini-2.0-pro-exp":{"audioCostTokens":1000000,"imageCostTokens":14512,"maxAudioLength":30240,"maxAudioPerPrompt":1,"maxFileSize":20971520,"maxImagePerPrompt":3000,"maxImageSize":null,"maxUrlSize":2147483648,"maxVideoLength":2700,"maxVideoPerPrompt":10,"vision":true,"supportedMimeTypes":["image/png","image/jpeg","video/mov","video/mpeg","video/mp4","video/mpg","video/avi","video/wmv","video/mpegps","video/x-flv","application/pdf","audio/aac","audio/flac","audio/mp3","audio/m4a","audio/mpga","audio/opus","audio/pcm","audio/wav","audio/webm","video/3gpp"],"contextWindow":2097152,"maxOutputTokens":8192,"json":true,"name":"gemini-2.0-pro-exp","maxInputTokens":2088960},"gemma-3-27b-it":{"contextWindow":128000,"maxOutputTokens":8192,"imageCostTokens":256,"maxImageSize":802816,"supportedMimeTypes":["image/png","image/jpeg","image/gif"],"fast":true,"json":true,"vision":true,"name":"gemma-3-27b-it","maxInputTokens":119808},"deepseek-r1":{"contextWindow":128000,"maxOutputTokens":32768,"reasoning":true,"name":"deepseek-r1","supportedMimeTypes":[],"maxInputTokens":95232},"text-embedding-3-large":{"embedding":true,"maxInputTokens":8191,"dimension":3072,"name":"text-embedding-3-large"},"text-embedding-3-small":{"embedding":true,"maxInputTokens":8191,"dimension":1536,"name":"text-embedding-3-small"},"gemini-embedding-exp-03-07":{"embedding":true,"maxInputTokens":8192,"dimension":3072,"name":"gemini-embedding-exp-03-07"},"claude-3-7-sonnet@20250219":{"contextWindow":200000,"maxOutputTokens":64000,"documentCostTokens":300000,"maxDocumentFile":33554432,"maxDocumentPages":100,"imageCostTokens":44236,"maxImagePerPrompt":100,"maxImageSize":4000000,"supportedMimeTypes":["image/png","image/jpeg","image/gif","image/webp","application/pdf"],"json":true,"reasoning":true,"tools":true,"vision":true,"name":"claude-3-7-sonnet@20250219","maxInputTokens":136000},"gemma3:27b":{"contextWindow":128000,"maxOutputTokens":8192,"imageCostTokens":256,"maxImageSize":802816,"supportedMimeTypes":["image/png","image/jpeg","image/gif"],"fast":true,"json":true,"vision":true,"name":"gemma-3-27b-it","maxInputTokens":119808},"gemini-2.0-flash-exp":{"audioCostTokens":1000000,"imageCostTokens":14512,"maxAudioLength":30240,"maxAudioPerPrompt":1,"maxFileSize":20971520,"maxImagePerPrompt":3000,"maxImageSize":null,"maxUrlSize":2147483648,"maxVideoLength":2700,"maxVideoPerPrompt":10,"vision":true,"supportedMimeTypes":["image/png","image/jpeg","video/mov","video/mpeg","video/mp4","video/mpg","video/avi","video/wmv","video/mpegps","video/x-flv","application/pdf","audio/aac","audio/flac","audio/mp3","audio/m4a","audio/mpga","audio/opus","audio/pcm","audio/wav","audio/webm","video/3gpp"],"contextWindow":1048576,"maxOutputTokens":8192,"fast":true,"json":true,"tools":false,"name":"gemini-2.0-flash-exp","maxInputTokens":1040384,"image":true}} | 
 | OPENAI_VOICE | String | OPENAI_VOICE | 
 | RETRIEVAL | Object | {"type":"retrieval"} | 
 | TEXT_EMBEDDING_3_SMALL | String | text-embedding-3-small | 
 | analyzeSessions | AsyncFunction | sessionIds, options | 
 | buildGptTrainingCase | Function | prompt, response, options | 
 | buildGptTrainingCases | Function | cases, opts | 
 | cancelGptFineTuningJob | AsyncFunction | aiId, job_id, options | 
 | countTokens | AsyncFunction | input, options | 
 | createGeminiEmbedding | AsyncFunction | aiId, input, options | 
 | createGptFineTuningJob | AsyncFunction | aiId, training_file, options | 
 | createOpenAIEmbedding | AsyncFunction | aiId, input, options | 
 | deleteFile | AsyncFunction | aiId, file_id, options | 
 | distillFile | AsyncFunction | attachments, o | 
 | getAi | AsyncFunction | id, options | 
 | getChatAttachmentCost | AsyncFunction | options | 
 | getChatPromptLimit | AsyncFunction | options | 
 | getGptFineTuningJob | AsyncFunction | aiId, job_id, options | 
 | getSession | AsyncFunction | sessionId, options | 
 | init | AsyncFunction | options | 
 | initChat | AsyncFunction | options | 
 | jpeg | String | image/jpeg | 
 | listFiles | AsyncFunction | aiId, options | 
 | listGptFineTuningEvents | AsyncFunction | aiId, job_id, options | 
 | listGptFineTuningJobs | AsyncFunction | aiId, options | 
 | listOpenAIModels | AsyncFunction | aiId, options | 
 | ogg | String | audio/ogg | 
 | prompt | AsyncFunction | input, options | 
 | promptAnthropic | AsyncFunction | aiId, content, options | 
 | promptGemini | AsyncFunction | aiId, content, options | 
 | promptOpenAI | AsyncFunction | aiId, content, options | 
 | resetSession | AsyncFunction | sessionId, options | 
 | tailGptFineTuningEvents | AsyncFunction | aiId, job_id, options | 
 | talk | AsyncFunction | input, options | 
 | trimPrompt | AsyncFunction | getPrompt, trimFunc, contextWindow, options | 
 | uploadFile | AsyncFunction | aiId, input, options | 
 | uploadFileForFineTuning | AsyncFunction | aiId, content, options | 
 | wav | String | audio/wav | 

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
 | _NEED | Array | mime,telegraf | 
 | default | AsyncFunction | options | 
 | BINARY_STRINGS | Array | off,on | 
 | COMMAND_DESCRIPTION_LENGTH | Number | 256 | 
 | COMMAND_LENGTH | Number | 32 | 
 | COMMAND_LIMIT | Number | 100 | 
 | EMOJI_BOT | String | 🤖 | 
 | EMOJI_SPEECH | String | 👂 | 
 | EMOJI_THINKING | String | 💬 | 
 | GROUP_LIMIT | Number | 3000 | 
 | HELLO | String | Hello! | 
 | MESSAGE_LENGTH_LIMIT | Number | 4096 | 
 | MESSAGE_SOFT_LIMIT | Number | 3891 | 
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
 | createWavHeader | Function | dataSize, sampleRate, numChannels, bitsPerSample | 
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
 | _NEED | Array | @sentry/node,@sentry/profiling-node | 
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
 | checkSearch | Function |  | 
 | checkVersion | AsyncFunction | pack | 
 | get | AsyncFunction | url, options | 
 | getCurrentIp | AsyncFunction | options | 
 | getCurrentPosition | AsyncFunction |  | 
 | getJson | AsyncFunction | u, o | 
 | getParsedHtml | AsyncFunction | u, o | 
 | getVersionOnNpm | AsyncFunction | packName | 
 | initSearch | AsyncFunction | options | 
 | search | AsyncFunction | query, options | 

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
 | OPENAI_TTS_MAX_LENGTH | Number | 4096 | 
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
 | BASE64 | String | BASE64 | 
 | BUFFER | String | BUFFER | 
 | DATAURL | String | DATAURL | 
 | FILE | String | FILE | 
 | MIME_BINARY | String | application/octet-stream | 
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
 | _NEED | Array | jsdom,youtube-transcript,@mozilla/readability | 
 | assertYoutubeUrl | Function |  | 
 | distill | AsyncFunction |  | 
 | distillHtml | AsyncFunction | input, options | 
 | distillPage | AsyncFunction | url, op | 
 | distillYoutube | AsyncFunction |  | 
 | getYoutubeMetadata | AsyncFunction |  | 
 | getYoutubeTranscript | AsyncFunction |  | 
 | isYoutubeUrl | Function |  | 
