import os
import json
import re
import google.generativeai as genai
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from app.config import settings
import logging
import time

logger = logging.getLogger(__name__)

# Gemini API 설정 (lazy 초기화)
_gemini_configured = False

def _ensure_gemini_configured():
    """Gemini API가 설정되었는지 확인하고, 안 됐으면 설정"""
    global _gemini_configured
    if _gemini_configured:
        return
    
    api_key = settings.GEMINI_API_KEY
    if not api_key or not api_key.strip():
        raise ValueError(
            "GEMINI_API_KEY가 설정되지 않았습니다.\n"
            "backend/.env 파일에 유효한 GEMINI_API_KEY를 설정해주세요.\n"
            "Google AI Studio(https://aistudio.google.com/apikey)에서 API 키를 발급받으세요."
        )
    
    genai.configure(api_key=api_key.strip())
    _gemini_configured = True
    logger.info("✅ Gemini API 설정 완료")

# 청크 크기 (Gemini는 큰 컨텍스트를 지원하므로 여유 있게 설정)
MAX_CHARS_PER_CHUNK = 30000
MAX_RETRIES = 4

class StepSchema(BaseModel):
    order: int
    action: str
    decision: bool
    task_type: str
    system_used: str
    next_steps: List[int]

class SwimLaneSchema(BaseModel):
    role: str
    steps: List[StepSchema]

class DecisionSchema(BaseModel):
    id: int
    question: str
    yes_outcome: str
    no_outcome: str

class RACISchema(BaseModel):
    task: str
    responsible: str
    accountable: str
    consulted: str
    informed: str

class SystemInterfaceSchema(BaseModel):
    system_a: str
    system_b: str
    interface_type: str
    description: str

class RegulationAnalysisSchema(BaseModel):
    process_name: str
    description: str
    swim_lanes: List[SwimLaneSchema]
    decisions: List[DecisionSchema]
    raci: List[RACISchema]
    system_interfaces: List[SystemInterfaceSchema]

SYSTEM_PROMPT = (
    "당신은 금융권 여신업무 프로세스 분석 전문가입니다.\n"
    "주어진 규정을 분석하여 다음을 추출합니다:\n"
    "1. 프로세스 이름\n"
    "2. Swim Lane (부서/역할별 단계)\n"
    "3. 의사결정 포인트\n"
    "4. RACI 매트릭스 (책임 담당자)\n"
    "5. 시스템 인터페이스 (연계 또는 사용되는 시스템 간 관계)\n\n"
    "주의사항 (필수 사항, 반드시 지킬 것):\n"
    "1. 각 단계(step)마다 'task_type' 필드를 반드시 포함하세요 (document, system, approval, general 중 택 1).\n"
    "2. 각 단계마다 'system_used' 필드를 반드시 포함하세요 (사용 시스템명이 없으면 null).\n"
    "3. 각 단계마다 'next_steps' 필드를 반드시 포함하세요 (이어지는 다음 단계들의 'order' 번호를 배열로 명시, 예: [3, 4], 마지막 단계이면 []).\n"
    "4. 규정에서 승인, 검토, 심사, 조건 판단, 분기 등의 의사결정 포인트를 반드시 최소 1개 이상 추출해야 합니다.\n"
    "   - 해당 swim_lane 단계에 'decision': true를 설정하세요.\n"
    "   - 'decisions' 배열에 반드시 해당 내용을 포함시켜야 합니다. 절대로 비워두지 마세요.\n"
    "   - decisions의 각 항목은 yes_outcome(조건 충족 시), no_outcome(조건 미충족 시)를 구체적으로 작성하세요.\n"
    "절대로 위 필드들을 생략하지 마세요.\n\n"
    "JSON 형식으로만 응답하세요."
)

JSON_FORMAT = """
{
  "process_name": "프로세스 이름",
  "description": "간단한 설명",
  "swim_lanes": [
    {
      "role": "부서/역할명",
      "steps": [
        {
          "order": 1, 
          "action": "액션 설명", 
          "decision": false,
          "task_type": "document", 
          "system_used": "사용 시스템명(없으면 null)",
          "next_steps": [2]
        },
        {
          "order": 2, 
          "action": "의사결정점", 
          "decision": true,
          "task_type": "approval",
          "system_used": null,
          "next_steps": [3, 4]
        }
      ]
    }
  ],
  "decisions": [
    {
      "id": 1,
      "question": "의사결정 질문",
      "yes_outcome": "Yes 결과",
      "no_outcome": "No 결과"
    }
  ],
  "raci": [
    {
      "task": "작업명",
      "responsible": "담당",
      "accountable": "책임",
      "consulted": "상의",
      "informed": "보고"
    }
  ],
  "system_interfaces": [
    {
      "system_a": "시스템A",
      "system_b": "시스템B",
      "interface_type": "인터페이스 유형",
      "description": "설명"
    }
  ]
}"""


def _parse_json_response(response_text: str) -> dict:
    """응답 텍스트에서 JSON을 추출하고 파싱"""
    content_text = response_text.strip()
    # 코드 블록 제거
    if content_text.startswith("```json"):
        content_text = content_text[7:]
    if content_text.startswith("```"):
        content_text = content_text[3:]
    if content_text.endswith("```"):
        content_text = content_text[:-3]
    content_text = content_text.strip()

    def ensure_dict(parsed_obj):
        if isinstance(parsed_obj, list):
            for item in parsed_obj:
                if isinstance(item, dict):
                    return item
            return {}
        if isinstance(parsed_obj, dict):
            return parsed_obj
        return {}

    # 직접 파싱 시도
    try:
        parsed = json.loads(content_text)
        return ensure_dict(parsed)
    except json.JSONDecodeError:
        pass

    # JSON 부분 추출 시도 ({...} 형태)
    json_start = content_text.find('{')
    json_end = content_text.rfind('}') + 1
    if json_start != -1 and json_end > json_start:
        json_str = content_text[json_start:json_end]
        try:
            parsed = json.loads(json_str)
            return ensure_dict(parsed)
        except json.JSONDecodeError:
            pass
            
    # 배열 형태 추출 시도 ([...] 형태)
    json_start = content_text.find('[')
    json_end = content_text.rfind(']') + 1
    if json_start != -1 and json_end > json_start:
        json_str = content_text[json_start:json_end]
        try:
            parsed = json.loads(json_str)
            return ensure_dict(parsed)
        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError("JSON not found in response", content_text, 0)


def _call_gemini_with_retry(text: str) -> dict:
    """Gemini API 호출 (재시도 포함)"""
    _ensure_gemini_configured()
    user_message = f"{SYSTEM_PROMPT}\n\n다음 규정을 분석해주세요:\n\n{text}\n\nJSON 응답 형식:{JSON_FORMAT}"
    delay = 30
    for attempt in range(MAX_RETRIES):
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                user_message,
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": RegulationAnalysisSchema
                }
            )
            return _parse_json_response(response.text)

        except json.JSONDecodeError as e:
            raise e
        except Exception as e:
            err_str = str(e)
            is_rate_limit = "429" in err_str or "rate_limit" in err_str or "RESOURCE_EXHAUSTED" in err_str
            if is_rate_limit and attempt < MAX_RETRIES - 1:
                logger.warning(f"[Rate Limit] {attempt+1}번 시도 실패. {delay}초 후 재시도...")
                time.sleep(delay)
                delay *= 2
            else:
                raise


def _merge_results(results: list) -> dict:
    """여러 청크 결과를 하나로 병합"""
    if not results:
        return {}
        
    first_result = results[0] if isinstance(results[0], dict) else {}
    merged = {
        "process_name": first_result.get("process_name", ""),
        "description": first_result.get("description", ""),
        "swim_lanes": [],
        "decisions": [],
        "raci": [],
        "system_interfaces": []
    }
    role_map = {}
    decision_offset = 0
    for result in results:
        if not isinstance(result, dict):
            continue
            
        for lane in result.get("swim_lanes", []):
            if not isinstance(lane, dict):
                continue
            role = lane.get("role", "")
            if role not in role_map:
                role_map[role] = []
            role_map[role].extend(lane.get("steps", []))
            
        for decision in result.get("decisions", []):
            if not isinstance(decision, dict):
                continue
            d = dict(decision)
            d["id"] = decision_offset + d.get("id", 0)
            merged["decisions"].append(d)
        decision_offset += len(result.get("decisions", []))
        
        merged["raci"].extend(result.get("raci", []))
        merged["system_interfaces"].extend(result.get("system_interfaces", []))

    for role, steps in role_map.items():
        for i, step in enumerate(steps, start=1):
            if isinstance(step, dict):
                step["order"] = i
        merged["swim_lanes"].append({"role": role, "steps": steps})

    return merged


def analyze_regulation(regulation_text: str) -> dict:
    """
    Gemini API를 사용하여 규정 텍스트 분석
    (기존 Claude analyze_regulation과 동일한 인터페이스)
    """
    if not regulation_text or not regulation_text.strip():
        raise ValueError("분석할 규정 텍스트가 비어 있습니다.")

    text = regulation_text.strip()
    chunks = []
    for i in range(0, len(text), MAX_CHARS_PER_CHUNK):
        chunk = text[i:i + MAX_CHARS_PER_CHUNK]
        if chunk.strip():
            chunks.append(chunk)

    try:
        results = []
        for idx, chunk in enumerate(chunks):
            # 첫 번째 이후 청크는 레이트 리밋 방지를 위해 대기
            if idx > 0:
                logger.info(f"[Chunk {idx+1}/{len(chunks)}] 레이트 리밋 방지 대기 중 (10초)...")
                time.sleep(10)
            try:
                result = _call_gemini_with_retry(chunk)
                results.append(result)
                logger.info(f"✅ Chunk {idx+1}/{len(chunks)} 분석 완료")
            except json.JSONDecodeError as e:
                results.append({
                    "process_name": f"청크 {idx+1} 분석 결과",
                    "description": f"JSON 파싱 실패: {str(e)}",
                    "swim_lanes": [],
                    "decisions": [],
                    "raci": [],
                    "system_interfaces": []
                })

        if len(results) == 1:
            final_res = results[0]
        else:
            final_res = _merge_results(results)

        # 필수 필드 보장 (Gemini가 빈 응답을 반환할 경우 대비)
        final_res.setdefault("process_name", "")
        final_res.setdefault("description", "")
        final_res.setdefault("swim_lanes", [])
        final_res.setdefault("decisions", [])
        final_res.setdefault("raci", [])
        final_res.setdefault("system_interfaces", [])

        # Fallback: 의사결정 배열이 비어있는 경우 swim_lanes에서 자동 생성
        if not final_res.get("decisions"):
            if "decisions" not in final_res:
                final_res["decisions"] = []
            decision_keywords = ['여부', '검토', '심사', '결정', '판단', '승인', '확인', '심의', '적정성', '가능']
            decision_id = 1
            for lane in final_res.get("swim_lanes", []):
                for step in lane.get("steps", []):
                    action = step.get("action", "")
                    is_decision = step.get("decision") or any(kw in action for kw in decision_keywords)
                    if is_decision:
                        final_res["decisions"].append({
                            "id": decision_id,
                            "question": action or "의사결정",
                            "yes_outcome": "해당 조건 만족 시 진행",
                            "no_outcome": "조건 불만족 시 반려/보완"
                        })
                        decision_id += 1
                        
        return final_res

    except Exception as e:
        raise Exception(f"Gemini API 호출 중 오류 발생: {str(e)}")


async def analyze_integration(analyses_data: list, integrated_name: str) -> dict:
    """
    여러 분석 결과를 통합하여 전체 프로세스 맵 생성
    (Gemini API 사용)
    """
    # 분석 데이터를 프롬프트에 포함
    analyses_summary = ""
    for idx, analysis in enumerate(analyses_data, 1):
        if not isinstance(analysis, dict):
            continue
            
        analyses_summary += f"\n## {analysis.get('edition', idx)}편: {analysis.get('process_name', '')}\n"
        analyses_summary += f"설명: {analysis.get('description', '')}\n"
        
        analyses_summary += "\n부서별 역할 (Swim Lanes):\n"
        swim_lanes = analysis.get('swim_lanes', [])
        if swim_lanes and isinstance(swim_lanes, list):
            for lane in swim_lanes:
                if not isinstance(lane, dict):
                    continue
                steps_desc = []
                for s in lane.get('steps', []):
                    if isinstance(s, dict):
                        steps_desc.append(s.get('action', ''))
                    else:
                        steps_desc.append(str(s))
                analyses_summary += f"- {lane.get('role', '')}: {', '.join(steps_desc)}\n"
        
        analyses_summary += "\nRACI 매트릭스:\n"
        raci = analysis.get('raci', [])
        if raci and isinstance(raci, list):
            for item in raci:
                if not isinstance(item, dict):
                    continue
                analyses_summary += f"- {item.get('task', '')}: R={item.get('responsible', '')}, A={item.get('accountable', '')}\n"
        analyses_summary += "\n"
    
    prompt = f"""
여러 여신업무 규정 분석 결과를 통합하여 전체 프로세스를 분석해주세요.

통합 분석명: {integrated_name}

다음은 각 편(章)별 분석 결과입니다:

{analyses_summary}

다음 항목들을 JSON 형식으로 분석해주세요:

1. **통합 프로세스 흐름**: 여러 편을 거쳐 진행되는 전체 프로세스
2. **부서 간 연계**: 각 편에서의 부서들 간의 데이터 흐름 및 연계
3. **주요 의사결정 포인트**: 전체 프로세스에서 가장 중요한 결정 지점들
4. **데이터 흐름**: 입력, 처리, 출력 데이터의 흐름
5. **시스템 인터페이스**: 필요한 시스템/도구들 간의 인터페이스
6. **리스크 포인트**: 프로세스 실패 가능성이 높은 지점들
7. **개선 기회**: 자동화나 효율화 가능한 부분들

JSON 응답 형식:
{{
    "integrated_process": {{
        "name": "통합 프로세스명",
        "description": "프로세스 설명",
        "steps": [
            {{
                "step_number": 1,
                "step_name": "단계명",
                "description": "설명",
                "responsible_department": "담당 부서",
                "related_editions": [1, 2],
                "outputs": ["결과물"]
            }}
        ]
    }},
    "department_interactions": [
        {{
            "from_dept": "부서A",
            "to_dept": "부서B",
            "data_flow": "데이터명",
            "related_editions": [1, 2]
        }}
    ],
    "critical_decision_points": [
        {{
            "point_name": "의사결정명",
            "edition": 1,
            "description": "설명",
            "impact": "영향도"
        }}
    ],
    "data_flow_diagram": {{
        "description": "데이터 흐름 설명",
        "flows": ["flow1", "flow2"]
    }},
    "system_interfaces": [
        {{
            "system_a": "시스템A",
            "system_b": "시스템B",
            "interface_type": "인터페이스 유형",
            "description": "설명"
        }}
    ],
    "risk_points": [
        {{
            "point_name": "리스크명",
            "edition": 1,
            "severity": "High/Medium/Low",
            "description": "설명",
            "mitigation": "완화 방법"
        }}
    ],
    "improvement_opportunities": [
        {{
            "area": "개선 영역",
            "description": "설명",
            "impact": "예상 효과",
            "priority": "High/Medium/Low"
        }}
    ]
}}

다른 설명 없이 JSON만 반환해주세요.
"""
    
    try:
        _ensure_gemini_configured()
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        response_text = response.text
        
        # JSON 파싱
        try:
            integrated_data = json.loads(response_text)
        except json.JSONDecodeError:
            # JSON 추출 시도
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                integrated_data = json.loads(json_match.group())
            else:
                integrated_data = {"raw_response": response_text}
        
        logger.info(f"✅ Integration analysis successful: {integrated_name}")
        return integrated_data
    
    except Exception as e:
        logger.error(f"Gemini API integration error: {str(e)}")
        raise Exception(f"Gemini API 통합 분석 중 오류 발생: {str(e)}")
