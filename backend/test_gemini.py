import sys
import json
import google.generativeai as genai
from pydantic import BaseModel, Field
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

class TestSchema(BaseModel):
    name: str
    age: int
    
model = genai.GenerativeModel('gemini-2.5-flash')
try:
    res = model.generate_content(
        'name is john age is 30',
        generation_config={
            'response_mime_type': 'application/json',
            'response_schema': TestSchema
        }
    )
    print("SUCCESS")
    print(res.text)
except Exception as e:
    print(f"FAILED: {e}")
