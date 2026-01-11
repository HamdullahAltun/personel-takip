import { prisma } from "@/lib/prisma";
import { groq } from "./index";

/**
 * Retrieves relevant documents for a given query.
 * Currently uses a keyword search + context stuffing approach suitable for small-medium knowledge bases.
 * Future upgrade: Use vector embeddings (KnowledgeBaseEmbedding) for semantic search.
 */
export async function getRelevantDocs(query: string, limit: number = 5): Promise<string> {
    // 1. Fetch ALL docs (or filter if possible)
    // For now, we fetch all and let the LLM decide or do simple keyword filtering in memory
    const allDocs = await prisma.knowledgeBaseDoc.findMany({
        take: 20, // Safety limit
        orderBy: { updatedAt: 'desc' }
    });

    if (allDocs.length === 0) return "Şirket bilgi bankasında henüz döküman yok.";

    // 2. Simple Keyword Scoring (In-Memory)
    const scoredDocs = allDocs.map(doc => {
        const content = (doc.title + " " + doc.content).toLowerCase();
        const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);
        let score = 0;
        keywords.forEach(k => {
            if (content.includes(k)) score += 1;
        });
        return { ...doc, score };
    });

    // 3. Sort by score
    scoredDocs.sort((a, b) => b.score - a.score);

    // 4. Return top N
    const topDocs = scoredDocs.slice(0, limit);

    return topDocs.map(d =>
        `--- DOKÜMAN: ${d.title} (${d.type}) ---\n${d.content}`
    ).join('\n\n');
}

/**
 * Log the AI Query for analytics and improvement
 */
export async function logAiQuery(userId: string, query: string, response: string, sourceIds: string[] = []) {
    try {
        await prisma.aiQueryLog.create({
            data: {
                userId,
                query,
                response,
                sources: sourceIds // passing as simple array, stored as Json
            }
        });
    } catch (e) {
        console.error("Failed to log AI query", e);
    }
}
