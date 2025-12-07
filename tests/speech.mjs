import { speech } from '../index.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('speech tts/stt offline', { timeout: 1000 * 60 * 5 }, async (t) => {
    const hasSay = await speech.checkSay().catch(() => false);
    if (!hasSay) {
        return t.skip('System text-to-speech (say) command is not available.');
    }

    const text = 'This is a test for the offline engine.';
    const audio = await speech.tts(text);
    assert.ok(audio, 'Audio was created properly.');

    const hasWhisper = await speech.checkWhisper().catch(() => false);
    if (!hasWhisper) {
        return t.skip('Offline speech-to-text (whisper-node) is not available.');
    }

    const result = await speech.stt(audio);
    assert.ok(result, 'Transcription result should not be empty.');
    assert.ok(typeof result === 'string', 'Transcription should be a string.');
    assert.match(
        result.toLowerCase(), /test/, 'Transcription should contain "test".'
    );
});
