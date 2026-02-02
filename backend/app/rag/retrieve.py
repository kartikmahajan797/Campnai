"""
Retrieval logic for Campnai RAG system.

Responsibilities:
1. Rewrite user query for better retrieval
2. Perform embedding-based similarity search
3. Rerank retrieved chunks using LLM
4. Return final ordered context chunks
"""

from typing import List
from pydantic import BaseModel, Field

from app.rag.llm import embed_text, generate_answer
from app.rag.vectorstore import VectorStore
from app.rag.prompt import (
    QUERY_REWRITE_PROMPT,
    RERANK_SYSTEM_PROMPT,
    FINAL_CONTEXT_PROMPT,
)



# ---------- Models ----------

class RetrievedChunk(BaseModel):
    text: str
    metadata: dict


class RankOrder(BaseModel):
    order: List[int] = Field(
        description="Chunk indices ordered from most relevant to least relevant"
    )


# ---------- Retrieval Engine ----------

class Retriever:
    def __init__(
        self,
        vector_store: VectorStore,
        retrieval_k: int = 10,
    ):
        self.vector_store = vector_store
        self.retrieval_k = retrieval_k

    # ---- Query rewriting ----
    def rewrite_query(self, question: str, history: List[dict]) -> str:
        prompt = QUERY_REWRITE_PROMPT.format(
            history=history,
            question=question,
        )
        rewritten = generate_answer(prompt)
        return rewritten.strip()

    # ---- Initial similarity search ----
    def similarity_search(self, query: str) -> List[RetrievedChunk]:
        query_embedding = embed_text(query)

        results = self.vector_store.similarity_search(
            query_embedding,
            top_k=self.retrieval_k,
        )

        return [
            RetrievedChunk(
                text=item["text"],
                metadata=item["metadata"],
            )
            for item in results
        ]

    # ---- LLM reranking ----
    def rerank(self, question: str, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        if not chunks:
            return []

        user_prompt = f"The user question is:\n{question}\n\nHere are the chunks:\n\n"

        for idx, chunk in enumerate(chunks):
            user_prompt += f"# CHUNK {idx + 1}:\n{chunk.text}\n\n"

        messages = f"""
{RERANK_SYSTEM_PROMPT}

{user_prompt}

Respond ONLY with JSON in the following format:
{{ "order": [1, 2, 3] }}
"""

        response = generate_answer(messages)
        order = RankOrder.model_validate_json(response).order

        # Convert 1-based index to 0-based
        return [chunks[i - 1] for i in order]

    # ---- Full retrieval pipeline ----
    def retrieve(self, question: str, history: List[dict]) -> List[RetrievedChunk]:
        rewritten_query = self.rewrite_query(question, history)
        candidates = self.similarity_search(rewritten_query)
        reranked = self.rerank(question, candidates)
        return reranked
