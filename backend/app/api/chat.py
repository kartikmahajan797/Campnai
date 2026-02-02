"""
Chat API endpoint for Campnai RAG chatbot.
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

from app.rag.vectorstore import VectorStore
from app.rag.retrieve import Retriever
from app.rag.llm import generate_answer
from app.rag.prompt import FINAL_CONTEXT_PROMPT


router = APIRouter(prefix="/chat", tags=["chat"])

# Global in-memory vector store
vector_store = VectorStore()

# Retriever instance
retriever = Retriever(vector_store=vector_store)


# ---------- Request / Response Models ----------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str


# ---------- Endpoint ----------

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Chat endpoint using Advanced RAG.
    """
    # Step 1: Retrieve relevant context
    chunks = retriever.retrieve(
        question=request.message,
        history=[m.dict() for m in request.history],
    )

    # Step 2: Build context string
    context = "\n\n".join(
        f"Source: {chunk.metadata.get('source', 'unknown')}\n{chunk.text}"
        for chunk in chunks
    )

    # Step 3: Final grounded prompt
    final_prompt = FINAL_CONTEXT_PROMPT.format(context=context)

    messages = f"""
{final_prompt}

User question:
{request.message}
"""

    # Step 4: Generate answer
    answer = generate_answer(messages)

    return ChatResponse(answer=answer)
