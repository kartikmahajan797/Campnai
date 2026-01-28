"""
Ingestion pipeline for Campnai RAG system.

Responsibilities:
1. Fetch documents from Firebase (Firestore)
2. Use LLM to intelligently chunk + rewrite documents
3. Generate embeddings
4. Store vectors in the VectorStore

NO LangChain
NO hardcoded provider
"""

from typing import List, Dict
from pydantic import BaseModel, Field
from tqdm import tqdm

from app.services.firebase import get_collection_documents
from app.rag.llm import generate_answer, embed_text
from app.rag.vectorstore import VectorStore
from app.rag.prompt import CHUNKING_PROMPT



# ---------- Data Models ----------

class Chunk(BaseModel):
    headline: str = Field(description="Short descriptive heading for this chunk")
    summary: str = Field(description="Concise summary optimized for QA retrieval")
    original_text: str = Field(description="Exact original text from the document")

    def as_text(self) -> str:
        """
        Canonical text representation stored in vector DB.
        """
        return f"{self.headline}\n\n{self.summary}\n\n{self.original_text}"


class ChunkList(BaseModel):
    chunks: List[Chunk]

def influencer_to_text(doc: dict) -> str:
        profile = doc.get("profile", {})
        metrics = doc.get("metrics", {})
        audience = doc.get("audience", {})
        brand = doc.get("brand", {})

        return f"""
    Influencer Name: {profile.get('name', '')}
    Instagram Profile: {profile.get('link', '')}
    Gender: {profile.get('gender', '')}
    Location: {profile.get('location', '')}

    Followers: {metrics.get('followers', 0)}
    Average Views: {metrics.get('avg_views', 0)}
    Engagement Rate: {metrics.get('engagement_rate', 0)}

    Audience:
    - Age Concentration: {audience.get('age_concentration', '')}
    - Gender Split: {audience.get('mf_split', '')}
    - India Split: {audience.get('india_split', '')}

    Brand Fit:
    - Niche: {brand.get('niche', '')}
    - Vibe: {brand.get('vibe', '')}
    - Brand Fit Score: {brand.get('brand_fit', '')}
    """.strip()


# ---------- Ingestion Pipeline ----------

class Ingestor:
    def __init__(
        self,
        collection_name: str,
        vector_store: VectorStore,
        average_chunk_size: int = 500,
    ):
        self.collection_name = collection_name
        self.vector_store = vector_store
        self.average_chunk_size = average_chunk_size

    def fetch_documents(self):
        raw_docs = get_collection_documents("test_campaign_001")


        print("RAW DOCS FROM FIRESTORE:")
        print(raw_docs)

        documents = []

        for idx, doc in enumerate(raw_docs):
            text = influencer_to_text(doc)

            if not text.strip():
                continue

            documents.append({
                "id": str(idx),
                "source": f"firestore:{self.collection_name}",
                "type": "influencer",
                "text": text,
            })

        return documents


    def _build_chunking_prompt(self, document: Dict) -> str:
        text = document["text"]

        return f"""
    You are an expert document chunker.

    Split the following document into semantically meaningful chunks.
    Each chunk must include:
    - a short headline
    - a concise summary
    - the original text of the chunk

    Document:
    {text}

    Respond ONLY in valid JSON that matches this schema:
    {{
    "chunks": [
        {{
        "headline": "...",
        "summary": "...",
        "original_text": "..."
        }}
    ]
    }}
    """


    def chunk_document(self, document: Dict):
        # TEMP: one chunk per document
        return [{
            "text": document["text"]
        }]

    

    def ingest(self):
        """
        Full ingestion pipeline:
        Firebase → LLM chunking → embeddings → vector store
        """
        documents = self.fetch_documents()
        print(f"[INGEST] Loaded {len(documents)} documents from Firestore")

        for document in tqdm(documents, desc="Ingesting documents"):
            try:
                chunks = self.chunk_document(document)

                for chunk in chunks:
                    text = chunk["text"]
                    embedding = embed_text(text)

                    self.vector_store.add(
                        embedding=embedding,
                        text=text,
                        metadata={
                            "source": document["source"],
                            "type": document["type"],
                            "doc_id": document["id"],
                        },
                    )

            except Exception as e:
                print(
                    f"[INGEST ERROR] Document {document['source']} failed: {str(e)}"
                )

        print(
            f"[INGEST COMPLETE] Vector store size: {len(self.vector_store.vectors)} chunks"
        )
