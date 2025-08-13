# server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

# Load environment variables from .env
load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing in .env file")
client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize FastAPI app
app = FastAPI()

# Allow frontend to access backend (CORS setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for AI queries
class AIRequest(BaseModel):
    question: str

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "FastAPI My Mentor backend is running with OpenAI connection!"}

# AI question endpoint
@app.post("/ask")
async def ask_ai(request: AIRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are My Mentor, a friendly and helpful educational assistant."},
                {"role": "user", "content": request.question}
            ]
        )
        answer = response.choices[0].message.content
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
