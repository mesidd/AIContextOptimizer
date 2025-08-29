import re
import google.generativeai as genai

def count_tokens(text: str, model_name: str, detailed: bool = False):

    try:
        # Get the generative model instance
        model = genai.GenerativeModel(model_name=model_name)
        
        # 1. Get the 100% accurate token count from the API
        accurate_token_count = model.count_tokens(text).total_tokens
        
        breakdown = None
        if detailed:
            # 2. Generate the "fake" visual breakdown for the UI
            breakdown = re.findall(r'[\w]+|[^\s\w]', text)
            
        # Return both values, matching the openai_service signature
        return accurate_token_count, breakdown
        
    except Exception as e:
        print(f"An error occurred while counting Gemini tokens: {e}")
        # Return a default value or re-raise the exception depending on desired error handling
        return 0, None