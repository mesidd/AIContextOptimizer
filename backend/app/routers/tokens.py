from fastapi import APIRouter
from pydantic import BaseModel
from app.services import gemini_service
import json
import os

router = APIRouter(prefix="/tokens", tags=["tokens"])

# Load model config
with open(os.path.join(os.path.dirname(__file__), "../config/models.json")) as f:
    MODEL_CONFIG = json.load(f)

class TokenRequest(BaseModel):
    model: str
    text: str
    detailed: bool = False
    output_tokens: int = 256

@router.post("/")
async def calculate_tokens(request: TokenRequest):
    model_info = MODEL_CONFIG.get(request.model)
    if not model_info:
        return {"error": "Model not supported"}

    provider = model_info["provider"]

    if provider == "google":
        token_count, breakdown = gemini_service.count_tokens(request.text, request.model, request.detailed)
    else:
        return {"error": "Provider not implemented"}

    # Calculate cost
    pricing = model_info["pricing"]
    unit_divisor = 1000 if pricing["unit"] == "1K" else 1_000_000
    cost_usd = (token_count / unit_divisor) * pricing["input"]

    # Input And Output Cost Separately
    input_cost_usd = (token_count / unit_divisor) * pricing["input"]
    output_cost_usd = (request.output_tokens / unit_divisor) * pricing["output"]
    total_cost_usd = input_cost_usd + output_cost_usd


    return {
        "model": request.model,
        "provider": provider,
        "input_tokens": token_count,
        "output_tokens": request.output_tokens,
        "input_cost_usd": round(input_cost_usd, 6),
        "output_cost_usd": round(output_cost_usd, 6),
        "cost_usd": round(total_cost_usd, 6),
        "breakdown": breakdown if request.detailed else None
    }
