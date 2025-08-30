import google.generativeai as genai

SUMMARIZATION_PROMPT_TEMPLATE = """
You are a highly efficient text compression algorithm. Your sole purpose is to summarize the provided text.

**CRITICAL RULES:**
1.  **DO NOT** add any commentary, explanations, or introductory phrases like "The user is asking..." or "This is a summary of...".
2.  If the 'Original Text' is already short (less than 60 words), do not try to summarize it. Instead, **RETURN THE ORIGINAL TEXT EXACTLY AS IT WAS PROVIDED.**
3.  Preserve all essential information, including names, places, numbers, and key decisions.
4.  Your output must be a concise, dense paragraph.

**Original Text:**
---
{text_to_summarize}
---
**Concise Summary:**
"""

def summarize_text(text_to_summarize: str, model_name: str = 'gemini-2.5-flash'):
  try:
    model = genai.GenerativeModel(model_name=model_name)
    prompt = SUMMARIZATION_PROMPT_TEMPLATE.format(text_to_summarize=text_to_summarize)
    response = model.generate_content(prompt)
    
    return response.text.strip()
  
  except Exception as e:
    print(f"Error during summarization: {e}")
    return "Error: Couldn't generate summary"