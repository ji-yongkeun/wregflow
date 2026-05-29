import asyncio
import json
from app.services.claude_analyzer import analyze_regulation, RegulationAnalysisSchema
import google.generativeai as genai
from app.config import settings

def test():
    text = "여신담당자는 여신 신청 접수 및 상담 진행 (여신 조건, 채권 보전, 자금 용도, 상환 방법, 인적사항, 담보 등 고려)을 수행한다. 이후 신용관리대상정보 보유 여부를 조회한다."
    result = analyze_regulation(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    test()
