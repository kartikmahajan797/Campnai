"""
In-memory vector store for semantic search.

This is intentionally simple and framework-free.
It can later be replaced with FAISS, Chroma, Pinecone, etc.
"""

import numpy as np
from typing import List, Dict, Any


class VectorStore:
    def __init__(self):
        # Each item: { "embedding": np.ndarray, "text": str, "metadata": dict }
        self.vectors: List[Dict[str, Any]] = []

    def add(self, embedding: List[float], text: str, metadata: Dict[str, Any] = None):
        """
        Add a single embedded chunk to the vector store.
        """
        self.vectors.append(
            {
                "embedding": np.array(embedding, dtype=np.float32),
                "text": text,
                "metadata": metadata or {},
            }
        )

    def similarity_search(self, query_embedding: List[float], top_k: int = 5):
        """
        Return top-k most similar chunks using cosine similarity.
        """
        if not self.vectors:
            return []

        query_vec = np.array(query_embedding, dtype=np.float32)

        def cosine_similarity(a, b):
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

        scored = [
            (cosine_similarity(query_vec, item["embedding"]), item)
            for item in self.vectors
        ]

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:top_k]]
