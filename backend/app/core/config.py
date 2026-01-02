import os
import firebase_admin
from firebase_admin import credentials, firestore
import json

def initialize_firebase():
    """
    Initializes Firebase Admin SDK.
    Supports: 
    1. FIREBASE_SERVICE_ACCOUNT_JSON env var (stringified JSON)
    2. FIREBASE_SERVICE_ACCOUNT_PATH env var (path to file)
    3. Local serviceAccountKey.json file
    """
    try:
        if firebase_admin._apps:
            return firestore.client()

        # 1. Try environment variable with full JSON string (Vercel best practice)
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                cert_dict = json.loads(service_account_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized using environment JSON")
                return firestore.client()
            except Exception as e:
                print(f"Failed to load FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

        # 2. Try file paths
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
        
        if not os.path.exists(service_account_path):
            # Try looking one level up (backend root)
            service_account_path = os.path.join("..", "serviceAccountKey.json")
        
        if not os.path.exists(service_account_path):
             # Try looking in the backend root explicitly
             backend_root = os.path.join(os.path.dirname(__file__), "..", "..")
             service_account_path = os.path.join(backend_root, "serviceAccountKey.json")

        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized with {service_account_path}")
        else:
            print("Warning: serviceAccountKey.json not found and no environment secret provided.")
            return None

        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

# Initialize db instance
db = initialize_firebase()
