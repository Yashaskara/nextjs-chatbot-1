// scripts/indexDocs.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import collectMdxFiles from './collectMdxFiles.js'; // or wherever you placed your recursive helper

// 1. Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Get the embedding model from env or use a default
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-large';

// 3. Directory to scan for MDX files
const docsDir = path.join(process.cwd(), 'pages', 'docs');

// 4. Function to split content into chunks by heading
function splitIntoChunks(content) {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = [];

  for (const line of lines) {
    // Start a new chunk if this line is a heading
    if (line.startsWith('#')) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n').trim());
        currentChunk = [];
      }
    }
    currentChunk.push(line);
  }

  // Add the last chunk if it exists
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n').trim());
  }

  // Filter out empty chunks
  return chunks.filter(chunk => chunk.length > 0);
}

// 5. Generate an embedding for a given chunk of text
async function generateEmbedding(text) {
  try {
    console.log(`Generating embedding (model: ${EMBEDDING_MODEL}) for snippet:`, text.substring(0, 80), '...');
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0]?.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.response?.data || error.message);
    return null;
  }
}

// 6. Main function: parse & embed all docs
async function parseAndEmbedDocs() {
  // Recursively collect all .mdx files
  const mdxFiles = collectMdxFiles(docsDir);
  console.log('Found MDX files:', mdxFiles);

  const docsEmbeddings = [];

  for (const filePath of mdxFiles) {
    // Read file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    // Parse frontmatter & content
    const { data: frontmatter, content } = matter(fileContents);

    // Split into chunks
    const chunks = splitIntoChunks(content);
    console.log(`File: ${filePath}, found ${chunks.length} chunks.`);

    for (const [index, chunkText] of chunks.entries()) {
      if (!chunkText) continue;

      // Generate embedding
      const embedding = await generateEmbedding(chunkText);
      if (embedding) {
        docsEmbeddings.push({
          filePath,        // full path of the file
          fileName: path.basename(filePath),
          frontmatter,
          chunkIndex: index,
          chunkText,
          embedding,
        });
      }
    }
  }

  return docsEmbeddings;
}

// 7. Execute & save the results
(async () => {
  try {
    const docsEmbeddings = await parseAndEmbedDocs();
    // Write to embeddings.json
    const outPath = path.join(process.cwd(), 'embeddings.json');
    fs.writeFileSync(outPath, JSON.stringify(docsEmbeddings, null, 2));
    console.log(`Embeddings saved to ${outPath}`);
  } catch (error) {
    console.error('Failed to index docs:', error);
  }
})();