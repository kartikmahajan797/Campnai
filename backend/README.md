# Campnai Backend

FastAPI backend with Firebase Firestore integration.

## Setup

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```

2.  **Create virtual environment (optional but recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\\Scripts\\activate
    ```

3.  **Install requirements:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Firebase Credentials:**

    *   Go to Firebase Console -> Project Settings -> Service Accounts.
    *   Generate a new private key.
    *   Save the file as `serviceAccountKey.json`.
    *   **Move `serviceAccountKey.json` to the `backend` folder.**

## Run Server

```bash
uvicorn app.main:app --reload
```

## Verify

*   Health Check: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
*   API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
