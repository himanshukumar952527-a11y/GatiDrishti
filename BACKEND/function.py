import os
import requests
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")

def fetch_pnr_status(pnr_number: str):
    url = f"https://{RAPIDAPI_HOST}/pnr-status/{pnr_number}"
    
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Raises an exception for 4xx/5xx errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to RapidAPI: {e}")
        return {"error": "Failed to fetch PNR status"}