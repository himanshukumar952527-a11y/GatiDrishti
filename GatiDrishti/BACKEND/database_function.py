import os
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_train_data(query: str):
    """
    Searches for a train in Supabase by train_id (exact match) 
    or by name (partial/case-insensitive match).
    """
    try:
        # 1. Try an exact match lookup by train number/ID first
        response = supabase.table("trains").select("*").eq("train_id", query).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]

        # 2. Fallback: Search case-insensitively by train name using ILIKE
        response_name = supabase.table("trains").select("*").ilike("name", f"%{query}%").execute()
        
        if response_name.data and len(response_name.data) > 0:
            return response_name.data[0]
            
        return None

    except Exception as e:
        # Pass the error up so the route can catch it
        raise e