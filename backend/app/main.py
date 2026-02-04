from fastapi import FastAPI
from app.api.routes import router as api_router
from app.api.influencers import router as influencers_router
from app.rag.vectorstore import VectorStore
from app.rag.ingest import Ingestor
from app.api.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Campnai Backend")
vector_store = VectorStore()
ingestor = Ingestor(
    collection_name="knowledge_base",
    vector_store=vector_store
)

@app.on_event("startup")
def startup_event():
    print("Starting ingestion...")
    ingestor.ingest()
    print("Ingestion complete")
app.include_router(chat_router)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)
app.include_router(influencers_router, prefix="/api/v1", tags=["influencers"])

if __name__ == "__main__":
    import uvicorn
    # In production, run with: uvicorn app.main:app --host 0.0.0.0 --port 8000
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
