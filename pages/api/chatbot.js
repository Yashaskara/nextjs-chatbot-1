// pages/api/chatbot.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Utility: Compute cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}

// Load embeddings from file (synchronously for simplicity)
const embeddingsPath = path.join(process.cwd(), 'embeddings.json');
let docsEmbeddings = [];
try {
    const data = fs.readFileSync(embeddingsPath, 'utf8');
    docsEmbeddings = JSON.parse(data);
} catch (err) {
    console.error('Error reading embeddings.json:', err);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { question } = req.body;
    if (!question) {
        res.status(400).json({ error: 'No question provided' });
        return;
    }

    try {
        // 1. Generate embedding for the query
        const queryEmbeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: question,
        });
        const queryEmbedding = queryEmbeddingResponse?.data[0]?.embedding;
        // 2. Compute similarity for each doc chunk
        const scoredChunks = docsEmbeddings.map((doc) => {
            const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
            return { ...doc, similarity };
        });

        // 3. Sort chunks by similarity (highest first)
        scoredChunks.sort((a, b) => b.similarity - a.similarity);

        // 4. Select top 3 chunks (adjust as needed)
        const topChunks = scoredChunks.slice(0, 3);

        // 5. Construct prompt: include retrieved chunks and the question
        let contextText = topChunks
            .map(
                (chunk, index) =>
                    `Context ${index + 1} (from ${chunk.fileName} - chunk ${chunk.chunkIndex + 1}):\n${chunk.chunkText}\n`
            )
            .join('\n');

        // Prepare messages for the ChatCompletion API
        const messages = [
            {
                role: 'system',
                content: `
                    You are a helpful assistant that answers questions by integrating the provided documentation excerpts with your general knowledge and common sense.
                    When answering, reference the documentation when relevant, but feel free to supplement your response with widely known facts—especially for basic CSS and JavaScript questions.
                    Use Markdown formatting for code, e.g., \`\`\`js code here\`\`\` for JavaScript.
                    If you are unsure or the documentation does not cover a topic, indicate that you do not know.
                    Provide relevant links to the documentation if applicable.
                `
            }, 
            {
                role: 'user',
                content: `Documentation:\n${contextText}\n\nQuestion: ${question}`
            }
        ];

        // 6. Call ChatCompletion API
        const chatResponse = await openai.chat.completions.create({
            model: 'gpt-4o', // or 'gpt-4' if available and desired
            messages,
            temperature: 0,
        });

        const answer = chatResponse?.choices[0]?.message?.content;
        console.log("Answer:", answer);
        res.status(200).json({ answer, topChunks });
    } catch (error) {
        console.error('Error in chatbot API:', error.response?.data || error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}