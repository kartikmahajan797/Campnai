CHUNKING_PROMPT = """
You are an expert technical documentation assistant.

Your task is to split the following document into overlapping, retrieval-optimized chunks
for use in a Retrieval-Augmented Generation (RAG) system.

Document type: {doc_type}
Source: {source}

Guidelines:
- Divide the document into approximately {estimated_chunks} chunks (you may use more or fewer if appropriate).
- Chunks should overlap by ~20–30% to preserve context.
- Each chunk MUST include:
  1. A short, descriptive headline
  2. A concise summary optimized for question answering
  3. The exact original text (unchanged)

Do NOT omit any part of the document.
Do NOT invent new information.
Do NOT reference this prompt.

Document:
{text}

Respond ONLY with valid JSON in the following format:

{{
  "chunks": [
    {{
      "headline": "...",
      "summary": "...",
      "original_text": "..."
    }}
  ]
}}
"""
QUERY_REWRITE_PROMPT = """
You are assisting in a conversation with a user about Campnai.

Conversation history:
{history}

User question:
{question}

Rewrite the user's question into a short, specific query
that is most likely to retrieve relevant information from a knowledge base.

Rules:
- Be concise
- Focus on concrete entities, names, or facts
- Do NOT include explanations
- Respond with ONLY the rewritten query
"""

RERANK_SYSTEM_PROMPT = """
You are a document re-ranking assistant.

You are given a user question and a list of text chunks.
The chunks are roughly ordered by relevance, but may not be optimal.

Your task:
- Rank all chunks by relevance to the question
- Most relevant chunk first
- Include ALL chunk indices
"""

FINAL_CONTEXT_PROMPT = """
Use the following context to answer the user's question accurately.
If the answer is not contained in the context, say you do not know.
"""
