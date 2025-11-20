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
            },
            initWorker: async () => {
                // Worker logic
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
        assert.equal(data.val, 123);
        await callosum.end();
    } else {
        // This part will be executed by the worker process, but the test runner 
        // typically runs the test file in the primary process. 
        // `callosum.init` handles the fork logic.
        // However, node:test might not play well with direct cluster forking within a single test file 
        // if re-executed in workers without care.
        // But `callosum` seems designed to handle `isPrimary` / `isWorker`.
        // The `init` call in the primary block handles forking.
        
        // Wait, if `callosum.init` forks, the workers will re-run this file?
        // If `node test.mjs` runs this file, the workers are forked with `node test.mjs`?
        // Usually `cluster.fork()` executes the same entry point.
        // If so, we need to ensure `init` is called in workers too.
        
        // The `init` function checks `isPrimary`. 
        // If `isWorker`, it runs `initWorker`.
        // So we need to call `init` in both primary and worker branches logic or just once globally.
        
        // Let's structure it to be safe.
        await callosum.init({
             initPrimary: async () => {
                callosum.on('TEST_DONE', (msg) => {
                    data.val = msg.result;
                    resolveWorkerReady();
                });
            },
            initWorker: async () => {
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
            await workerReadyPromise;
            assert.equal(data.val, 123);
            await callosum.end();
        }
    }
});
