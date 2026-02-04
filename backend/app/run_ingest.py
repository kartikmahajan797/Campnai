from app.rag.ingest import Ingestor
from app.rag.vectorstore import VectorStore

# Initialize vector store (in-memory)
vector_store = VectorStore()

# Initialize ingestor
ingestor = Ingestor(
    collection_name="knowledge_base",  # 🔁 change if your Firestore collection has a different name
    vector_store=vector_store,
)

# Run ingestion
ingestor.ingest()
