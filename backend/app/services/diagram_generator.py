import io
import base64
from typing import Optional
import json

def generate_process_mermaid(data: dict) -> str:
    """통합 프로세스 Mermaid 코드 생성"""
    if not data or 'integrated_process' not in data:
        return ''
    
    process = data['integrated_process']
    if 'steps' not in process:
        return ''
    
    code = 'graph LR\n'
    steps = process['steps']
    
    for idx, step in enumerate(steps):
        if not isinstance(step, dict): continue
        node_id = f'A{idx}'
        label = f'"{step.get("step_name", "")}<br/>({step.get("responsible_department", "")})"'
        code += f'    {node_id}[{label}]\n'
        
        if idx < len(steps) - 1:
            code += f'    {node_id} --> A{idx + 1}\n'
    
    for idx in range(len(steps)):
        code += f'    style A{idx} fill:#4F46E5,stroke:#2E2AA0,stroke-width:2px,color:#fff\n'
    
    return code

def generate_interaction_mermaid(data: dict) -> str:
    """부서 간 데이터 흐름 Mermaid 코드 생성"""
    if not data or 'department_interactions' not in data:
        return ''
    
    interactions = data['department_interactions']
    if not interactions:
        return ''
    
    code = 'graph TB\n'
    
    depts = set()
    for inter in interactions:
        if not isinstance(inter, dict): continue
        depts.add(inter.get('from_dept', ''))
        depts.add(inter.get('to_dept', ''))
    
    dept_list = sorted(list(depts))
    
    for idx, dept in enumerate(dept_list):
        code += f'    D{idx}["{dept}"]\n'
    
    for inter in interactions:
        if not isinstance(inter, dict): continue
        from_dept = inter.get('from_dept', '')
        to_dept = inter.get('to_dept', '')
        if from_dept in dept_list and to_dept in dept_list:
            from_idx = dept_list.index(from_dept)
            to_idx = dept_list.index(to_dept)
            data_flow = inter.get('data_flow', '')
            code += f'    D{from_idx} -->|"{data_flow}"| D{to_idx}\n'
    
    for idx in range(len(dept_list)):
        code += f'    style D{idx} fill:#4F46E5,stroke:#2E2AA0,stroke-width:2px,color:#fff\n'
    
    return code

def generate_decision_mermaid(data: dict) -> str:
    """의사결정 포인트 Mermaid 코드 생성"""
    if not data or 'critical_decision_points' not in data:
        return ''
    
    decisions = data['critical_decision_points']
    if not decisions:
        return ''
    
    code = 'graph TD\n'
    
    for idx, decision in enumerate(decisions):
        if not isinstance(decision, dict): continue
        point_name = decision.get('point_name', '')
        code += f'    D{idx}{{"{point_name}"}}\n'
        code += f'    D{idx} -->|YES| Y{idx}["✓ 진행"]\n'
        code += f'    D{idx} -->|NO| N{idx}["✗ 반려"]\n'
        code += f'    style D{idx} fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff\n'
        code += f'    style Y{idx} fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff\n'
        code += f'    style N{idx} fill:#EF4444,stroke:#DC2626,stroke-width:2px,color:#fff\n'
    
    return code

def mermaid_to_png(mermaid_code: str) -> Optional[bytes]:
    """
    Mermaid 코드를 PNG로 변환
    (주: 실제 구현은 puppeteer 또는 mermaid-cli 필요)
    """
    try:
        import subprocess
        import tempfile
        import os
        
        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False, encoding='utf-8') as f:
            f.write(mermaid_code)
            mermaid_file = f.name
        
        output_file = mermaid_file.replace('.mmd', '.png')
        
        try:
            # mmdc (mermaid-cli) 사용
            result = subprocess.run(
                ['mmdc', '-i', mermaid_file, '-o', output_file],
                capture_output=True,
                timeout=30,
                shell=True
            )
            
            if result.returncode == 0 and os.path.exists(output_file):
                with open(output_file, 'rb') as f:
                    png_bytes = f.read()
                
                # 정리
                os.remove(mermaid_file)
                os.remove(output_file)
                
                return png_bytes
        except Exception as e:
            print(f"mmdc 실행 실패: {e}")
        
        # 정리
        if os.path.exists(mermaid_file):
            os.remove(mermaid_file)
        if os.path.exists(output_file):
            os.remove(output_file)
        
        return create_placeholder_png()
    
    except Exception as e:
        print(f"Mermaid PNG 변환 실패: {e}")
        return create_placeholder_png()

def create_placeholder_png() -> bytes:
    """
    mmdc가 없을 경우 플레이스홀더 PNG 생성
    (1x1 투명 PNG)
    """
    # 1x1 투명 PNG (Base64)
    png_base64 = (
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9Q'
        'DwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
    return base64.b64decode(png_base64)
