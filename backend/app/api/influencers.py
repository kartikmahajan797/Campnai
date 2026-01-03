from fastapi import APIRouter, UploadFile, File, HTTPException, status
import pandas as pd
import io
import uuid
from datetime import datetime
from app.core.config import db
from google.cloud import firestore
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
        # Decode contents to handle various encodings
        content_str = contents.decode('utf-8-sig') # handle BOM if present
        
        # Try different delimiters
        def try_parse(sep):
            return pd.read_csv(io.StringIO(content_str), sep=sep)

        try:
            # First try default comma
            df = try_parse(',')
            # If only one column, try tab (common when copy-pasting from Sheets/Excel)
            if len(df.columns) <= 1:
                df = try_parse('\t')
        except:
             # Fallback
             df = pd.read_csv(io.StringIO(content_str))

        # Normalize column names: strip whitespace and convert to upper case
        # This fixes issues where " NAME" or "name" wouldn't match "NAME"
        df.columns = [col.strip().upper() for col in df.columns]
        print(f"Detected columns: {df.columns.tolist()}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

    # Validate Columns (using normalized list)
    # Check if we have at least the critical ones
    available_cols = df.columns.tolist()
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in available_cols]
    if missing_cols:
        # If headers are totally weird, let's provide more info
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}. Available: {', '.join(available_cols[:5])}...")

    created_at = datetime.utcnow()
    campaign_id = "test_campaign_001"
    collection_ref = db.collection("campaigns").document(campaign_id).collection("influencers")
    
    count = 0
    batch = db.batch()
    
    try:
        # Iterate through rows
        for _, row in df.iterrows():
            influencer_id = str(uuid.uuid4())
            
            # safely access columns (keys are now normalized upper case)
            def get_val(col):
                # Ensure we also search with upper/stripped
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
        if count > 0:
            batch.commit()

    except Exception as e:
        print(f"Firestore Error: {str(e)}")
        if "firestore.googleapis.com" in str(e).lower():
            raise HTTPException(
                status_code=500, 
                detail="Firestore API is disabled. Please enable it in Google Cloud Console."
            )
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "status": "success",
        "uploaded_records": count,
        "campaign_id": campaign_id
    }

@router.get("/influencers")
async def get_influencers(page: int = 1, page_size: int = 10, campaign_id: str = "test_campaign_001"):
    """
    Fetches influencers from Firestore with pagination.
    """
    try:
        if page < 1:
            page = 1
        
        collection_ref = db.collection("campaigns").document(campaign_id).collection("influencers")
        
        # Get total count (using aggregation for better performance if possible, but standard count for now)
        # Note: In production with large datasets, consider maintaining a counter or using Firestore count queries
        total_docs = collection_ref.count().get()[0][0].value
        
        # Query for paginated results
        # Firestore pagination works with cursor-based pagination (startAfter) or offset (limit/offset)
        # Offset is easier but less efficient for very large datasets. 
        # For simplicity and given the usage, we'll use limit/offset or just limit with ordering.
        
        query = collection_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(page_size).offset((page - 1) * page_size)
        docs = query.stream()
        
        influencers = []
        for doc in docs:
            influencer_data = doc.to_dict()
            influencer_data["id"] = doc.id
            # Convert datetime to string for JSON serialization
            if "created_at" in influencer_data and isinstance(influencer_data["created_at"], datetime):
                influencer_data["created_at"] = influencer_data["created_at"].isoformat()
            influencers.append(influencer_data)
            
        return {
            "influencers": influencers,
            "total": total_docs,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total_docs / page_size) if total_docs > 0 else 0
        }
        
    except Exception as e:
        print(f"Error fetching influencers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
