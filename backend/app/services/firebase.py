"""
Firebase service utilities for Campnai backend.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate(
        os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")
    )
    firebase_admin.initialize_app(cred)

db = firestore.client()


def get_collection_documents(collection_name: str):
    """
    Fetch all documents from a Firestore collection.

    Each document is returned as a dict with an added `id` field.
    """
    docs_ref = db.collection(collection_name)
    docs = docs_ref.stream()

    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)

    return results
