from app.rag.llm import embed_text
from app.rag.ingest import Ingestor
from app.rag.vectorstore import VectorStore

# Create vector store
vector_store = VectorStore()

# Create ingestor
ingestor = Ingestor(
    collection_name="knowledge_base",
    vector_store=vector_store
)

# Run ingestion
ingestor.ingest()

print(f"Vector store size: {len(vector_store.vectors)}")

queries = [
    "fashion influencer",
    "beauty creator female",
    "high engagement instagram influencer",
]

for query in queries:
    print("\nQUERY:", query)
    query_embedding = embed_text(query)
    results = vector_store.similarity_search(query_embedding, top_k=3)

    for i, r in enumerate(results, 1):
        print(f"\nResult {i}:")
        print(r["text"][:300])
