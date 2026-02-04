"""
Firebase service utilities for Campnai backend.
"""

from firebase_admin import credentials, firestore, initialize_app
import firebase_admin

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    initialize_app(cred)

db = firestore.client()


def get_collection_documents(campaign_id: str):
    docs_ref = (
        db.collection("campaigns")
          .document(campaign_id)
          .collection("influencers")
    )

    docs = docs_ref.stream()
    return [doc.to_dict() for doc in docs]



