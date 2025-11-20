import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callosum } from '../index.mjs';

test('callosum cluster integration', { timeout: 15000 }, async () => {
    const data = { val: 0 };
    let resolveWorkerReady;
    const workerReadyPromise = new Promise(resolve => resolveWorkerReady = resolve);

    if (callosum.isPrimary) {
        await callosum.init({
            initPrimary: async () => {
                callosum.on('TEST_DONE', (msg) => {
                    data.val = msg.result;
                    resolveWorkerReady();
                });
                callosum.on('BROADCAST_RECEIVED', (msg) => {
                    data.broadcastReceived = true;
                });
                // Wait a bit for workers to be ready before broadcasting
                setTimeout(() => {
                    callosum.boardcast('TEST_BROADCAST', { msg: 'hello' });
                }, 2000);
            },
            initWorker: async () => {
                // Worker logic
                callosum.on('TEST_BROADCAST', (msg) => {
                    if (msg.msg === 'hello') {
                        callosum.report('BROADCAST_RECEIVED', { success: true });
                    }
                });

                if (callosum.worker.id === 1) {
                    // Simulate some work
                    setTimeout(async () => {
                        await callosum.set('test_key', 123);
                        const val = await callosum.get('test_key');
                        callosum.report('TEST_DONE', { result: val });
                    }, 1000);
                }
            }
        });

        await workerReadyPromise;
        // Wait a bit more for broadcast cycle to complete if needed, or rely on workerReadyPromise if it covers enough time.
        // Since broadcast is triggered after 2000ms, and workerReadyPromise might resolve earlier (after 1000ms).
        // We need to wait for broadcast verification.
        await new Promise(r => setTimeout(r, 3000));
        
        assert.equal(data.val, 123);
        assert.equal(data.broadcastReceived, true, 'Worker should receive broadcast');
        await callosum.end();
    } else {
        // This part will be executed by the worker process
        await callosum.init({
             initPrimary: async () => {
                callosum.on('TEST_DONE', (msg) => {
                    data.val = msg.result;
                    resolveWorkerReady();
                });
            },
            initWorker: async () => {
                callosum.on('TEST_BROADCAST', (msg) => {
                    if (msg.msg === 'hello') {
                        callosum.report('BROADCAST_RECEIVED', { success: true });
                    }
                });

                if (callosum.worker.id === 1) {
                    setTimeout(async () => {
                        await callosum.set('test_key', 123);
                        const val = await callosum.get('test_key');
                        callosum.report('TEST_DONE', { result: val });
                    }, 500);
                }
            }
        });
        
        if (callosum.isPrimary) {
            // Should not be reached here if logic is correct as isPrimary block above handles it?
            // Actually, in the worker process, `callosum.isPrimary` is false.
            // But we are in the `else` block of the top-level `if (callosum.isPrimary)`.
            // Wait, `node test.mjs` runs the file.
            // Primary runs `if (callosum.isPrimary) { ... }`
            // Worker runs `else { ... }`?
            // Yes, `callosum.isPrimary` is checked at top level.
            
            // But wait, if I use `await callosum.init` inside the `if/else`, 
            // `callosum.isPrimary` is static based on cluster.
            // So the logic is fine.
        }
    }
});
