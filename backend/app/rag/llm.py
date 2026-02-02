"""
LLM and embedding interface for Campnai RAG system.

This module is provider-agnostic.
Currently implemented using Ollama (local, open-source).
"""

import requests
from typing import List

OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "llama3.2"
EMBED_MODEL = "nomic-embed-text"


def embed_text(text: str) -> List[float]:
    """
    Generate embeddings for a given text using Ollama.
    """
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/embeddings",
        json={
            "model": EMBED_MODEL,
            "prompt": text,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["embedding"]


def generate_answer(prompt: str) -> str:
    """
    Generate a completion from the LLM using Ollama.
    """
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["response"]
