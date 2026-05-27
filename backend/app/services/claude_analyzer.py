from anthropic import Anthropic
from app.config import settings
import json

# Anthropic 클라이언트 초기화 (settings.CLAUDE_API_KEY 사용)
client = Anthropic(api_key=settings.CLAUDE_API_KEY)

def analyze_regulation(regulation_text: str) -> dict:
    if not regulation_text or not regulation_text.strip():
        raise ValueError("분석할 규정 텍스트가 비어 있습니다.")
        
    system_prompt = (
        "당신은 규정 분석 전문가입니다.\n"
        "주어진 규정을 분석하여 다음을 추출합니다:\n"
        "1. 프로세스 이름\n"
        "2. Swim Lane (부서/역할별 단계)\n"
        "3. 의사결정 포인트\n"
        "4. RACI 매트릭스 (책임 담당자)\n\n"
        "JSON 형식으로만 응답하세요."
    )
    
    user_message = f"""다음 규정을 분석해주세요:

{regulation_text}

JSON 응답 형식:
{{
  "process_name": "프로세스 이름",
  "description": "간단한 설명",
  "swim_lanes": [
    {{
      "role": "부서/역할명",
      "steps": [
        {{"order": 1, "action": "액션 설명", "decision": false}},
        {{"order": 2, "action": "의사결정점", "decision": true}}
      ]
    }}
  ],
  "decisions": [
    {{
      "id": 1,
      "question": "의사결정 질문",
      "yes_outcome": "Yes 결과",
      "no_outcome": "No 결과"
    }}
  ],
  "raci": [
    {{
      "task": "작업명",
      "responsible": "담당",
      "accountable": "책임",
      "consulted": "상의",
      "informed": "보고"
    }}
  ]
}}"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        content_text = response.content[0].text
        
        try:
            # 마크다운 ```json ... ``` 블록 제거 전처리
            cleaned_text = content_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            return json.loads(cleaned_text)
            
        except json.JSONDecodeError:
            # JSON 파싱 에러 시 원본 텍스트 응답을 반환하면서도 UI 깨짐을 예방하기 위한 래핑 구조
            return {
                "process_name": "규정 분석 결과 (텍스트)",
                "description": content_text,
                "swim_lanes": [],
                "decisions": [],
                "raci": []
            }
            
    except Exception as e:
        raise Exception(f"Claude API 호출 중 오류 발생: {str(e)}")
