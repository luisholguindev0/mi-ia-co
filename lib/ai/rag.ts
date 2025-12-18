/**
 * lib/ai/rag.ts
 * RAG Pipeline: Embedding Generation + Vector Similarity Search
 * Uses Supabase pgvector for semantic retrieval
 * 
 * ARCHITECTURE NOTE:
 * We use vector embeddings (1536 dimensions) to allow the "Doctor" agent 
 * to find relevant context even if the user uses different words 
 * (e.g. "inventory" vs "stock" vs "cajas").
 */

import { supabaseAdmin } from '@/lib/db';
import { BUSINESS_CONFIG } from '@/lib/config';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = BUSINESS_CONFIG.ai.ragSimilarityThreshold;
const MAX_RESULTS = 5;

interface KnowledgeChunk {
    id: string;
    content: string;
    metadata: any;
    category: string | null;
    similarity: number;
}

/**
 * Generate embedding vector from text
 * Currently configured for OpenAI (Industry Standard)
 * Cost is negligible (~$0.02 for large datasets)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY missing. RAG will fail. Please add it to .env.local");
        // Fail loudly so we don't silently degrade to a "dumb" bot
        throw new Error("Missing OPENAI_API_KEY for Vector Brain");
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: text,
            model: EMBEDDING_MODEL,
        }),
    });

    if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Search knowledge_base using vector similarity
 * Returns top N most relevant chunks
 */
export async function searchKnowledgeBase(
    queryEmbedding: number[],
    category?: string,
    limit: number = MAX_RESULTS
): Promise<KnowledgeChunk[]> {
    // Using Supabase RPC for vector similarity search
    const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: limit,
        filter_category: category || undefined,
    });

    if (error) {
        console.error('RAG search error:', error);
        return [];
    }

    return data as KnowledgeChunk[];
}

/**
 * Full RAG retrieval pipeline
 * 1. Generate embedding from user query
 * 2. Search knowledge_base
 * 3. Format context for prompt injection
 */
export async function retrieveContext(
    userQuery: string,
    category?: string
): Promise<string> {
    try {
        const embedding = await generateEmbedding(userQuery);
        const chunks = await searchKnowledgeBase(embedding, category);

        if (chunks.length === 0) {
            return 'No se encontró contexto relevante en la base de conocimiento.';
        }

        // Format chunks for prompt injection
        return (chunks as KnowledgeChunk[])
            .map((chunk, i) => `[${i + 1}] ${chunk.content} (Fuente: ${(chunk.metadata as { source?: string })?.source || 'Internal'})`)
            .join('\n\n');
    } catch (error) {
        console.error('RAG retrieval error:', error);
        return 'Error al recuperar contexto. El sistema opera sin memoria a largo plazo.';
    }
}

/**
 * Insert new knowledge with embeddings
 */
export async function insertKnowledge(
    content: string,
    category: string,
    metadata: Record<string, unknown> = {}
): Promise<void> {
    const embedding = await generateEmbedding(content);

    const { error } = await supabaseAdmin.from('knowledge_base').insert({
        content,
        category,
        metadata: metadata as any,
        embedding: JSON.stringify(embedding),
    });

    if (error) {
        throw new Error(`Failed to insert knowledge: ${error.message}`);
    }
}
