from app.rag.ingest import Ingestor
from app.rag.vectorstore import VectorStore

vector_store = VectorStore()

ingestor = Ingestor(
    collection_name="knowledge_base", 
    vector_store=vector_store
)

ingestor.ingest()
