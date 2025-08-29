import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel,Field
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Literal, Optional
import google.generativeai as genai
from dotenv import load_dotenv

from app.routers import tokens

load_dotenv()

origins = [ "http://localhost:3000" ]

app = FastAPI(
    title="Gemini API with FastAPI",
    description="A simple API to interact with Google's Gemini Flash model."
)

app.include_router(tokens.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

SYSTEM_INSTRUCTION = (
    "You are a helpful friend. Answer clearly, concisely, and politely."
    "Keep your answer in 1 or 2 lines only with few words."
)



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

class TokenizeRequest(BaseModel):
    model: str
    text: str
    detailed: bool = Field(default=False)

class TokenResponse(BaseModel):
    input_tokens: int
    word_count: int
    character_count: int
    tokens: Optional[List[str]] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to the Gemini API wrapper. Go to /docs for the API documentation."}

@app.post("/generate", response_model = GeminiResponse)
async def generate_text(request: PromptRequest):

    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction = SYSTEM_INSTRUCTION)

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
    

@app.post('/tokenize', response_model = TokenResponse)
async def count_tokens(request: TokenizeRequest):
    try:
        model =  genai.GenerativeModel(model_name = request.model)

        accurate_token_count = model.count_tokens(request.text).total_tokens

        word_count = len(request.text.split())
        character_count = len(request.text)

        visual_tokens = None
        if request.detailed:
            visual_tokens = re.findall(r'[\w]+|[^\s\w]', request.text)

        return {
            "input_tokens": accurate_token_count,
            "word_count": word_count,
            "character_count": character_count,
            "tokens": visual_tokens
        }
    except Exception as e:
        print(f"Error during tokenization: {e}")
        raise HTTPException(status_code=500, detail=str(e))