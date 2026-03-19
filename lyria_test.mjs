import { GoogleAuth } from 'google-auth-library';
import fs from 'fs/promises';

async function main() {
    const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));
    const auth = new GoogleAuth({
        keyFile: config.google_credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId() || config.google_project;
    const token = await client.getAccessToken();

    const region = 'us-central1';
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/lyria-002:predict`;

    const payload = {
        instances: [
            {
                prompt: "happy music, like a warm summer day"
            }
        ]
    };

    console.log(`Sending request to ${url}...`);
    const start = Date.now();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const predictions = data.predictions || [];
    console.log(`Success! Returned ${predictions.length} sample(s) in ${(Date.now() - start) / 1000}s.`);

    for (let i = 0; i < predictions.length; i++) {
        const audioB64 = predictions[i].bytesBase64Encoded || predictions[i];
        if (audioB64) {
            const buf = Buffer.from(audioB64, 'base64');
            const file = `./lyria_test_sample_${i}.wav`;
            await fs.writeFile(file, buf);
            console.log(`Saved sample to ${file}`);
        }
    }
}

main().catch(console.error);
