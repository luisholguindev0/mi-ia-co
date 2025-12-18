/**
 * scripts/test-deepseek.ts
 * Verifies DeepSeek API connectivity and model availability
 * 
 * Usage: npx tsx scripts/test-deepseek.ts
 */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import fs from 'fs';
import path from 'path';

// Helper to load .env.local without 'dotenv' package
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                envVars[key] = value;
            }
        });
        return envVars;
    } catch (e) {
        console.error('Could not read .env.local', e);
        return {};
    }
}

const env = loadEnv();
const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

async function main() {
    console.log('🧪 Testing DeepSeek Integration...');

    const apiKey = DEEPSEEK_API_KEY;
    if (!apiKey) {
        console.error('❌ DEEPSEEK_API_KEY is missing in .env.local');
        process.exit(1);
    }
    console.log(`✅ API Key found: ${apiKey.slice(0, 4)}...`);

    const deepseek = createDeepSeek({
        apiKey: apiKey,
    });

    try {
        console.log('🤖 Sending request to deepseek-chat (V3)...');
        const start = Date.now();

        // Test V3 (Chat)
        const { text } = await generateText({
            model: deepseek('deepseek-chat'),
            prompt: 'Hello! Are you ready to be a sales agent for Mi IA Colombia?',
        });

        const latency = Date.now() - start;
        console.log(`✅ Response received in ${latency}ms`);
        console.log(`🗣️  DeepSeek V3 says: "${text}"`);
        console.log('-----------------------------------');
        console.log('🎉 DeepSeek Integration Verified!');

    } catch (error) {
        console.error('❌ API Error:', error);
        console.error('\nTroubleshooting:\n1. Check your API key.\n2. Ensure you have credits.\n3. Check DeepSeek status page.');
        process.exit(1);
    }
}

main();
