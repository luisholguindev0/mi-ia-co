/**
 * scripts/load-test.ts
 * Simulates high concurrency to test Webhook & Inngest ingestion.
 * 
 * Usage: npx tsx scripts/load-test.ts
 */

// Load test script

const TOTAL_REQUESTS = 50;
const CONCURRENCY = 10;
const ENDPOINT = 'http://localhost:3000/api/webhook/whatsapp';

const generatePayload = (i: number) => ({
    object: "whatsapp_business_account",
    entry: [{
        id: "WHATSAPP_BUS_ID",
        changes: [{
            value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "123", phone_number_id: "123" },
                contacts: [{ profile: { name: `Load User ${i}` }, wa_id: `5730000000${i}` }],
                messages: [{
                    from: `5730000000${i}`,
                    id: `wamid.load.${Date.now()}.${i}`,
                    timestamp: Math.floor(Date.now() / 1000),
                    text: { body: "Is this thing fast?" },
                    type: "text"
                }]
            },
            field: "messages"
        }]
    }]
});

async function sendRequest(i: number) {
    const start = Date.now();
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generatePayload(i))
        });
        const duration = Date.now() - start;
        return { status: response.status, duration };
    } catch (e) {
        return { status: 500, duration: Date.now() - start, error: e };
    }
}

async function runLoadTest() {
    console.log(`🚀 Starting Load Test: ${TOTAL_REQUESTS} requests, concurrency ${CONCURRENCY}`);

    const results: Array<{ status: number; duration: number; error?: unknown }> = [];

    // Chunking
    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const chunk = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS - i) }, (_, k) => i + k);
        console.log(`Sending batch ${i} - ${i + chunk.length}...`);

        const chunkResults = await Promise.all(chunk.map(idx => sendRequest(idx)));
        results.push(...chunkResults);
    }

    // Stats
    const success = results.filter(r => r.status === 200).length;
    const avgTime = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

    console.log(`\n📊 Results:`);
    console.log(`Total: ${TOTAL_REQUESTS}`);
    console.log(`Success: ${success} (200 OK)`);
    console.log(`Failed: ${TOTAL_REQUESTS - success}`);
    console.log(`Avg Duration: ${avgTime.toFixed(2)}ms`); // Should be low since webhook is async
}

runLoadTest();
