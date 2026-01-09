import Groq from "groq-sdk";
import { User, Task, FieldTask } from "@prisma/client";

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

/**
 * Calculates a match score (0-100) for assigning a task to a user.
 * Higher is better.
 */
export function calculateMatchScore(user: User & { tasksReceived: any[], fieldTasks: any[] }, task: Task | FieldTask): number {
    let score = 50; // Base score

    // 1. Workload Penalty
    // Heavier penalty for meaningful workload
    const activeTaskCount = (user.tasksReceived?.length || 0) + (user.fieldTasks?.length || 0);
    score -= (activeTaskCount * 10);

    // 2. Skill Matching
    if (task.tags && task.tags.length > 0 && user.skills && user.skills.length > 0) {
        const matchingSkills = task.tags.filter(tag =>
            user.skills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()))
        );
        score += (matchingSkills.length * 25);
    }

    // 3. Status/Role Bonus (Example: Seniors get harder tasks?)
    // kept simple for now

    return Math.max(0, Math.min(100, score));
}

/**
 * AI-powered text analysis to extract skills/tags from a task description
 * (Mock implementation if API key missing, or real if present)
 */
export async function extractTagsFromText(text: string): Promise<string[]> {
    if (!groq) return ["general"];

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Extract technical skills or categories from the text as a JSON array of strings (lowercase). Example: ['react', 'database']. Return ONLY JSON." },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192"
        });

        const content = completion.choices[0]?.message?.content;
        const json = content?.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
        if (json) return JSON.parse(json);
        return ["general"];
    } catch (e) {
        console.error("AI Tag Extraction Failed", e);
        return ["general"];
    }
}

/**
 * Generate a professional or fun social post based on a few keywords or mood.
 */
export async function generatePostContent(prompt: string, type: 'PROFESSIONAL' | 'FUN' | 'APPRECIATION'): Promise<string> {
    if (!groq) return "Harika bir gün geçirmeniz dileğiyle!";

    try {
        const systemPrompt = type === 'APPRECIATION'
            ? "Write a short, heart-warming appreciation message for a colleague based on the input. Turkish language."
            : type === 'PROFESSIONAL'
                ? "Write a short, professional status update for a workplace social wall based on the input. Turkish language."
                : "Write a fun, engaging short social media post for a workplace based on the input. Turkish language.";

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            model: "llama3-8b-8192"
        });

        return completion.choices[0]?.message?.content?.replace(/"/g, '') || "";
    } catch (e) {
        return prompt;
    }
}

/**
 * Generate poll options based on a question.
 */
export async function generatePollOptions(question: string): Promise<string[]> {
    if (!groq) return ["Evet", "Hayır", "Belki"];

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Generate 4 short, distinct poll options for the given question. Return ONLY a JSON array of strings. Turkish language." },
                { role: "user", content: question }
            ],
            model: "llama3-8b-8192"
        });

        const content = completion.choices[0]?.message?.content;
        const json = content?.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
        if (json) return JSON.parse(json);
        return ["Seçenek 1", "Seçenek 2"];
    } catch (e) {
        return ["Evet", "Hayır"];
    }
}

/**
 * Analyze sentiment of a message.
 * Returns: { score: number (-1 to 1), label: string }
 */
export async function analyzeSentiment(text: string): Promise<{ score: number, label: string }> {
    if (!groq) return { score: 0, label: "NEUTRAL" };

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Analyze the sentiment of the text. Return JSON: { score: number (-1.0 to 1.0), label: string (POSITIVE, NEUTRAL, NEGATIVE) }."
                },
                { role: "user", content: text }
            ],
            model: "llama3-8b-8192",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        return JSON.parse(content || '{"score": 0, "label": "NEUTRAL"}');
    } catch (e) {
        return { score: 0, label: "NEUTRAL" };
    }
}
