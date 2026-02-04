from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.vectorstore import VectorStore
from app.rag.llm import embed_text, generate_answer
from app.rag.ingest import Ingestor
from fastapi.responses import StreamingResponse
router = APIRouter()

def stream_answer(prompt: str):
    for token in generate_answer(prompt, stream=True):
        yield token

# Build vector store at startup
vector_store = VectorStore()
ingestor = Ingestor(
    collection_name="knowledge_base",
    vector_store=vector_store
)
#ingestor.ingest()


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat")
def chat(request: ChatRequest):
    print("/chat endpoint hit")
    
    if request.question.lower().strip() in ["hi", "hello", "hey"]:
        return {"answer": "Hi! Ask me anything about influencer marketing 😊"}
    
    query_embedding = embed_text(request.question)
    results = vector_store.similarity_search(query_embedding, top_k=3)

    context = "\n\n".join(
        f"- {r['text']}" for r in results
    )

    prompt = f"""
You are an influencer marketing assistant.

Based on the following influencer data, answer the user's question.

Influencer data:
{context}

User question:
{request.question}

Give a clear, helpful answer. If unsure, say so.
"""

    return StreamingResponse(
    stream_answer(prompt),
    media_type="text/plain"
)
