import requests
import json
from dotenv import load_dotenv
import os

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

if not API_KEY:
    print("❌ API key not found. Make sure your .env file is in the backend folder and named exactly '.env'")
    exit()

# Backend API endpoint
url = "http://127.0.0.1:8000/ask"

# Data to send
payload = {"question": "Hello AI, can you hear me?"}

# Send request to your backend
try:
    response = requests.post(url, json=payload)
    print("✅ Status Code:", response.status_code)
    print("💬 Response:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("❌ Error:", e)
