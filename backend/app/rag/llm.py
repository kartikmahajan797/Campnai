"""
LLM and embedding interface for Campnai RAG system.

This module is provider-agnostic.
Currently implemented using Ollama (local, open-source).
"""

import requests
from typing import List
import json
OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "phi"
EMBED_MODEL = "nomic-embed-text"

# ---------- EMBEDDINGS ----------

def embed_text(text: str) -> List[float]:
    """
    Generate embeddings for a given text using Ollama.
    """
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={
                "model": EMBED_MODEL,
                "prompt": text,
            },
            timeout=120,  # ⬅ increased
        )
        response.raise_for_status()
        return response.json()["embedding"]

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Ollama embedding failed: {str(e)}")


# ---------- GENERATION ----------

def generate_answer(prompt: str, stream: bool = False):
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": stream,
        },
        stream=stream,
        timeout=180,
    )
    response.raise_for_status()

    if not stream:
        return response.json()["response"]

    def token_generator():
        yield "Thinking...\n"
        for line in response.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8"))
            except json.JSONDecodeError:
                continue

            if "response" in data:
                yield data["response"]

            if data.get("done") is True:
                break

    return token_generator()

def generate_rerank(prompt: str) -> str:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0,
                "num_predict": 64,  
            },
        },
        timeout=25, 
    )
    response.raise_for_status()
    return response.json()["response"]
