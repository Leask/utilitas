// dependencies
import * as fileType from 'file-type';
import * as math from 'mathjs';
import * as uuid from 'uuid';
// features
import _ from './lib/horizon.mjs'
import * as alan from './lib/alan.mjs';
import * as bee from './lib/bee.mjs';
import * as bot from './lib/bot.mjs';
import * as boxes from './lib/boxes.json' with { type: 'json' };
import * as cache from './lib/cache.mjs';
import * as callosum from './lib/callosum.mjs';
import * as dbio from './lib/dbio.mjs';
import * as email from './lib/email.mjs';
import * as encryption from './lib/encryption.mjs';
import * as event from './lib/event.mjs';
import * as image from './lib/image.mjs';
import * as media from './lib/media.mjs';
import * as memory from './lib/memory.mjs';
import * as network from './lib/network.mjs';
import * as sentinel from './lib/sentinel.mjs';
import * as shekel from './lib/shekel.mjs';
import * as shell from './lib/shell.mjs';
import * as shot from './lib/shot.mjs';
import * as sms from './lib/sms.mjs';
import * as speech from './lib/speech.mjs';
import * as ssl from './lib/ssl.mjs';
import * as storage from './lib/storage.mjs';
import * as tape from './lib/tape.mjs';
import * as uoid from './lib/uoid.mjs';
import * as utilitas from './lib/utilitas.mjs';
import * as vision from './lib/vision.mjs';
import * as web from './lib/web.mjs';
import color from './lib/color.mjs';
import manifest from './lib/manifest.mjs';

// Export
export * as default from './lib/utilitas.mjs';
export {
    // dependencies
    fileType, math, uuid,
    // features
    alan, bee, bot, boxes, cache, callosum, color, dbio, email, encryption,
    event, image, manifest, media, memory, network, sentinel, shekel, shell,
    shot, sms, speech, ssl, storage, tape, uoid, utilitas, vision, web
};

if (utilitas.inBrowser() && !globalThis.utilitas) {
    globalThis.utilitas = {
        boxes, color, encryption, event, manifest, math, shekel, shot, speech,
        storage, uoid, utilitas, uuid,
    };
    // top-level await workaround
    (async () => {
        utilitas.log(
            `(${manifest.homepage}) is ready!`,
            `${(await utilitas.which(manifest)).title}.*`
        );
    })();
}
