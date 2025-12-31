from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pandas as pd
import io
import uuid
from datetime import datetime
from app.core.config import db
import math

router = APIRouter()

REQUIRED_COLUMNS = [
    "PROFILE LINK", "NAME", "LOCATION", "NICHE"
]

def clean_float(value):
    """Safely convert value to float, handling diverse formats."""
    if pd.isna(value) or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        # Remove commas, percentage signs, etc.
        cleaned = value.replace(",", "").replace("%", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    return 0.0

def clean_str(value):
    """Safely clean string values."""
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()

@router.post("/upload-csv", status_code=status.HTTP_201_CREATED)
async def upload_csv(file: UploadFile = File(...)):
    """
    Uploads a CSV file containing influencer data and stores it in Firestore.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

    # Validate Columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    created_at = datetime.utcnow()
    campaign_id = "test_campaign_001"
    collection_ref = db.collection("campaigns").document(campaign_id).collection("influencers")
    
    count = 0
    batch = db.batch()
    
    try:
        # Iterate through rows
        for _, row in df.iterrows():
            influencer_id = str(uuid.uuid4())
            
            # safely access columns
            def get_val(col):
                return row.get(col, None)

            record = {
                "profile": {
                    "link": clean_str(get_val("PROFILE LINK")),
                    "name": clean_str(get_val("NAME")),
                    "gender": clean_str(get_val("GENDER")),
                    "location": clean_str(get_val("LOCATION")),
                    "type": clean_str(get_val("TYPE")),
                },
                "metrics": {
                    "followers": clean_float(get_val("FOLLOWERS")),
                    "avg_views": clean_float(get_val("AVERAGE VIEWS")),
                    "engagement_rate": clean_float(get_val("ENGAGEMENT RATE"))
                },
                "audience": {
                    "mf_split": clean_str(get_val("M/F SPLIT")),
                    "india_split": clean_str(get_val("INDIA 1/2 SPLIT")),
                    "age_concentration": clean_str(get_val("AGE CONCENTRATION"))
                },
                "brand": {
                    "niche": clean_str(get_val("NICHE")),
                    "brand_fit": clean_str(get_val("BRAND FIT")),
                    "vibe": clean_str(get_val("VIBE"))
                },
                "commercials": clean_str(get_val("COMMERCIALS")),
                "contact": {
                    "contact_no": clean_str(get_val("CONTACT NO.")),
                    "email": clean_str(get_val("EMAIL"))
                },
                "created_at": created_at
            }

            doc_ref = collection_ref.document(influencer_id)
            batch.set(doc_ref, record)
            count += 1
            
            # Firestore batch limit is 500
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()

        # Commit remaining
        if count % 1 != 0 or count > 0: # Ensure we commit if any records were added
            batch.commit()

    except Exception as e:
        print(f"Firestore Error: {str(e)}")
        # Check if it's the "API disabled" error
        if "firestore.googleapis.com" in str(e).lower():
            raise HTTPException(
                status_code=500, 
                detail="Firestore API is disabled. Please enable it in Google Cloud Console: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=campnai-42f13"
            )
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "status": "success",
        "uploaded_records": count,
        "campaign_id": campaign_id
    }
