from fastapi import APIRouter
from pydantic import BaseModel
from app.services import optimizer_service, gemini_service

router = APIRouter(prefix='/optimizer', tags=['Optimizer'])

class OptimizeRequest(BaseModel):
  text: str
  model: str

class SummarizeResponse(BaseModel):
  summary: str
  original_token_count: int
  summary_token_count: int

@router.post('/summarize', response_model = SummarizeResponse)
async def summarize_context(request: OptimizeRequest):

  summary = optimizer_service.summarize_text(request.text, request.model)

  original_token_count, _ = gemini_service.count_tokens(request.text, request.model)
  summary_token_count, _ = gemini_service.count_tokens(summary, request.model)

  return SummarizeResponse(
    summary = summary ,
    original_token_count = original_token_count,
    summary_token_count = summary_token_count
  )