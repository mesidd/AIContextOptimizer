import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Literal
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

origins = [ "http://localhost:3000" ]

app = FastAPI(
    title="Gemini API with FastAPI",
    description="A simple API to interact with Google's Gemini Flash model."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

SYSTEM_INSTRUCTION = (
    "You are a friendly AI who teases and flirt with the user diligently."
    "You keep your answer short and concise, so that user need be overwhelmed by your answer."
    "Add fun and tweak wherever possible."
    "Try to answer according to the user replies in limited words."
)

model = genai.GenerativeModel('gemini-2.5-flash', system_instruction = SYSTEM_INSTRUCTION)

try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set.")
    genai.configure(api_key=api_key)

except Exception as e:
    print(f"Error configuring Gemini: {e}")

class Message(BaseModel):
    role: Literal['user', 'model']
    content: str
class PromptRequest(BaseModel):
    messages: List[Message]
class GeminiResponse(BaseModel):
    generated_text: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Gemini API wrapper. Go to /docs for the API documentation."}

@app.post("/generate", response_model = GeminiResponse)
async def generate_text(request: PromptRequest):

    history = [{"role": msg.role, "parts": msg.content} for msg in request.messages]

    if not history:
        raise HTTPException(status_code=400, detail="No messages provided.")
    
    try:
        response = model.generate_content(history)

        if not response.text:
            raise HTTPException(status_code=500, detail="Failed to generate text. The model may have returned an empty response.")
        return GeminiResponse(generated_text=response.text)

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while communicating with the Gemini API: {str(e)}")