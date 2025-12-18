/**
 * scripts/generate-embeddings.ts
 * One-time script to generate embeddings for knowledge base entries that don't have them
 * Run with: npx tsx scripts/generate-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small',
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function main() {
    console.log('🔍 Finding entries without embeddings...');

    // Get entries that don't have embeddings
    const { data: entries, error } = await supabase
        .from('knowledge_base')
        .select('id, content')
        .is('embedding', null);

    if (error) {
        console.error('Failed to fetch entries:', error);
        process.exit(1);
    }

    console.log(`📊 Found ${entries?.length || 0} entries without embeddings`);

    if (!entries || entries.length === 0) {
        console.log('✅ All entries have embeddings!');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
        try {
            console.log(`⏳ Processing: "${entry.content.substring(0, 50)}..."`);

            const embedding = await generateEmbedding(entry.content);

            const { error: updateError } = await supabase
                .from('knowledge_base')
                .update({ embedding })
                .eq('id', entry.id);

            if (updateError) {
                console.error(`❌ Update failed for ${entry.id}:`, updateError);
                errorCount++;
            } else {
                console.log(`✅ Embedded: ${entry.id}`);
                successCount++;
            }

            // Rate limit: 60 requests/min for OpenAI
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (err) {
            console.error(`❌ Failed to embed ${entry.id}:`, err);
            errorCount++;
        }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
}

main().catch(console.error);
