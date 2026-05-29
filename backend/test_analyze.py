import asyncio
import json
from app.services.claude_analyzer import analyze_regulation

def test():
    text = "여신담당자는 시스템에 접속하여 여신을 신청한다. 이후 심사역이 승인한다."
    result = analyze_regulation(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    test()
