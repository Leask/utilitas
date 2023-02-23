# 🧰 utilitas

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Node.js Package](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Leask/utilitas/actions/workflows/npm-publish.yml)

Just another common utility for JavaScript.

Works in Node.js and modern browsers.

## Features

### [bot](./lib/bot.mjs)

```JavaScript
["default","end","init","send"]
```

### [cache](./lib/cache.mjs)

```JavaScript
["default","init"]
```

### [callosum](./lib/callosum.mjs)

```JavaScript
["boardcast","default","engage","get","getListeners","ignore","init","on","once","report","set"]
```

### [color](./lib/color.mjs)

```JavaScript
["default"]
```

### [dbio](./lib/dbio.mjs)

```JavaScript
["assembleInsert","assembleQuery","assembleSet","assembleTail","assembleUpdate","countAll","countByKeyValue","default","deleteAll","deleteById","deleteByKeyValue","end","execute","init","insert","query","queryAll","queryById","queryByKeyValue","rawAssembleKeyValue","rawExecute","rawQuery","updateById","updateByKeyValue","upsert"]
```

### [email](./lib/email.mjs)

```JavaScript
["default","getSenderName","init","rawSend","send"]
```

### [encryption](./lib/encryption.mjs)

```JavaScript
["defaultAlgorithm","digestObject","getSortedQueryString","hash","hashFile","hexToBigInt","random","randomString","sha256","sha256File","uniqueString"]
```

### [event](./lib/event.mjs)

```JavaScript
["bulk","default","end","list","load","loop"]
```

### [horizon](./lib/horizon.mjs)

```JavaScript
["default"]
```

### [manifest](./lib/manifest.mjs)

```JavaScript
["default"]
```

### [network](./lib/network.mjs)

```JavaScript
["getCurrentPosition","httping","isLocalhost","pickFastestHost","pickFastestHttpServer","ping"]
```

### [sentinel](./lib/sentinel.mjs)

```JavaScript
["default","init"]
```

### [shekel](./lib/shekel.mjs)

```JavaScript
["getExchangeRate"]
```

### [shell](./lib/shell.mjs)

```JavaScript
["assertExist","default","exec","exist","which"]
```

### [shot](./lib/shot.mjs)

```JavaScript
["checkVersion","default","get","getCurrentIp","getCurrentPosition","getVersionOnNpm"]
```

### [sms](./lib/sms.mjs)

```JavaScript
["default","init","send"]
```

### [storage](./lib/storage.mjs)

```JavaScript
["assertPath","encodeBase64DataURL","exists","getConfig","getConfigFilename","getTempPath","isTextFile","legalFilename","mapFilename","readFile","readIni","readJson","setConfig","touchPath","writeFile","writeIni","writeJson","writeTempFile"]
```

### [tape](./lib/tape.mjs)

```JavaScript
["addChatId","default","end","init","removeChatId"]
```

### [uoid](./lib/uoid.mjs)

```JavaScript
["bigIntToUuid","compactUuid","create","default","expandUuid","fakeUuid","getRfcUrlNamespaceUuid","getTimestampFromUuid","getUuidForCurrentHost","rotateUuid","uuidRegTxt","uuidToBigInt"]
```

### [utilitas](./lib/utilitas.mjs)

```JavaScript
["__","arrayEqual","assembleApiUrl","assembleUrl","assertDate","assertEmail","assertFunction","assertSet","assertUrl","assertUuid","asyncTimeout","base64Decode","base64Encode","base64Pack","base64Unpack","basename","byteToHexString","checkInterval","clone","convertBase","convertFrom16to10","distill","ensureArray","ensureDate","ensureInt","ensureString","extError","extract","fileURLToPath","fullLengthLog","getDateByUnixTimestamp","getItemFromStringOrArray","getKeyByValue","getRandomIndexInArray","getRandomInt","getRandomItemInArray","getShortestInArray","getType","getUnixTimestampByDate","hexDecode","hexEncode","humanReadableBoolean","ignoreErrFunc","inBrowser","insensitiveCompare","is","isAscii","isNull","isSet","isUndefined","log","makeStringByLength","mapKeys","mask","matchVersion","mergeAtoB","newError","once","parseJson","parseVersion","prettyJson","purgeEmoji","range","renderCode","resolve","rotate","shiftTime","split","throwError","timeout","toExponential","toString","trim","tryUntil","uniqueArray","verifyEmail","verifyPhone","verifyUrl","verifyUuid","which"]
```
