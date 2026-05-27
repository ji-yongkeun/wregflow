from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.analysis import AnalysisGroup
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
import json
import os
import tempfile
from datetime import datetime
from io import BytesIO
from app.services.diagram_generator import (
    generate_process_mermaid,
    generate_interaction_mermaid,
    generate_decision_mermaid,
    mermaid_to_png,
    create_placeholder_png
)

router = APIRouter(prefix="/api/download", tags=["download"])

@router.get("/integration/{integration_id}/word")
async def download_integration_as_word(
    integration_id: str,
    db: Session = Depends(get_db)
):
    """
    통합 분석 결과를 Word 문서로 다운로드 (다이어그램 포함)
    """
    try:
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        doc = Document()
        
        # 제목
        title = doc.add_heading(f'🎯 {integration.group_name}', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # 메타정보
        meta_para = doc.add_paragraph()
        meta_para.add_run('생성일시: ').bold = True
        meta_para.add_run(integration.created_at.strftime('%Y-%m-%d %H:%M:%S'))
        
        doc.add_paragraph()
        
        # ========== 다이어그램 섹션 ==========
        doc.add_heading('📊 통합 분석 다이어그램', level=1)
        
        data = integration.integrated_data or {}
        
        # 1. 통합 프로세스
        try:
            mermaid_code = generate_process_mermaid(data)
            if mermaid_code:
                doc.add_heading('📊 통합 프로세스 흐름', level=2)
                png_bytes = mermaid_to_png(mermaid_code)
                
                if png_bytes:
                    doc.add_picture(BytesIO(png_bytes), width=Inches(5.5))
                    last_paragraph = doc.paragraphs[-1]
                    last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    doc.add_paragraph('(다이어그램 이미지 생성 실패)')
                
                doc.add_paragraph()
        except Exception as e:
            print(f"프로세스 다이어그램 생성 실패: {e}")
        
        # 2. 부서 간 데이터 흐름
        try:
            mermaid_code = generate_interaction_mermaid(data)
            if mermaid_code:
                doc.add_heading('🔗 부서 간 데이터 흐름', level=2)
                png_bytes = mermaid_to_png(mermaid_code)
                
                if png_bytes:
                    doc.add_picture(BytesIO(png_bytes), width=Inches(5.5))
                    last_paragraph = doc.paragraphs[-1]
                    last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    doc.add_paragraph('(다이어그램 이미지 생성 실패)')
                
                doc.add_paragraph()
        except Exception as e:
            print(f"상호작용 다이어그램 생성 실패: {e}")
        
        # 3. 의사결정 포인트
        try:
            mermaid_code = generate_decision_mermaid(data)
            if mermaid_code:
                doc.add_heading('⚡ 의사결정 포인트', level=2)
                png_bytes = mermaid_to_png(mermaid_code)
                
                if png_bytes:
                    doc.add_picture(BytesIO(png_bytes), width=Inches(5.5))
                    last_paragraph = doc.paragraphs[-1]
                    last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    doc.add_paragraph('(다이어그램 이미지 생성 실패)')
                
                doc.add_paragraph()
        except Exception as e:
            print(f"의사결정 다이어그램 생성 실패: {e}")
        
        # ========== 텍스트 섹션 ==========
        doc.add_heading('📋 상세 정보', level=1)
        
        if data:
            # 1. 통합 프로세스
            if 'integrated_process' in data:
                doc.add_heading('📊 통합 프로세스 흐름', level=2)
                process = data['integrated_process']
                if 'steps' in process:
                    for step in process['steps']:
                        p = doc.add_paragraph(style='List Bullet')
                        p.add_run(f"Step {step.get('step_number', '')} - {step.get('step_name', '')}").bold = True
                        p.add_run(f" ({step.get('responsible_department', '')})")
                doc.add_paragraph()
            
            # 2. 부서 간 데이터 흐름
            if 'department_interactions' in data:
                doc.add_heading('🔗 부서 간 데이터 흐름', level=2)
                interactions = data['department_interactions']
                for inter in interactions:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{inter.get('from_dept', '')} → {inter.get('to_dept', '')}").bold = True
                    p.add_run(f": {inter.get('data_flow', '')}")
                doc.add_paragraph()
            
            # 3. 의사결정 포인트
            if 'critical_decision_points' in data:
                doc.add_heading('⚡ 의사결정 포인트', level=2)
                decisions = data['critical_decision_points']
                for decision in decisions:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{decision.get('point_name', '')}").bold = True
                    p.add_run(f" ({decision.get('severity', 'Medium')} Impact)")
                    doc.add_paragraph(decision.get('description', ''), style='List Bullet 2')
                doc.add_paragraph()
            
            # 4. 리스크 포인트
            if 'risk_points' in data:
                doc.add_heading('⚠️ 리스크 포인트', level=2)
                risks = data['risk_points']
                for risk in risks:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{risk.get('point_name', '')} - {risk.get('severity', '')}").bold = True
                    doc.add_paragraph(f"완화방법: {risk.get('mitigation', '')}", style='List Bullet 2')
                doc.add_paragraph()
            
            # 5. 개선 기회
            if 'improvement_opportunities' in data:
                doc.add_heading('💡 개선 기회', level=2)
                improvements = data['improvement_opportunities']
                for improvement in improvements:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{improvement.get('area', '')} - {improvement.get('priority', 'Medium')}").bold = True
                    doc.add_paragraph(f"예상효과: {improvement.get('impact', '')}", style='List Bullet 2')
        
        filename = f"통합분석_{integration_id[:8]}.docx"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        
        doc.save(filepath)
        
        return FileResponse(
            filepath,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Word 다운로드 실패: {str(e)}")

@router.get("/integration/{integration_id}/excel")
async def download_integration_as_excel(
    integration_id: str,
    db: Session = Depends(get_db)
):
    """
    통합 분석 결과를 Excel로 다운로드 (다이어그램 포함)
    """
    try:
        from openpyxl.drawing.image import Image as XLImage
        
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        wb = Workbook()
        
        # Sheet 1: 다이어그램
        ws_diagram = wb.active
        ws_diagram.title = "다이어그램"
        
        ws_diagram['A1'] = f"🎯 {integration.group_name} - 다이어그램"
        ws_diagram['A1'].font = ws_diagram['A1'].font.copy()
        
        data = integration.integrated_data or {}
        row = 3
        
        # 1. 통합 프로세스 다이어그램
        try:
            mermaid_code = generate_process_mermaid(data)
            if mermaid_code:
                ws_diagram[f'A{row}'] = '📊 통합 프로세스 흐름'
                row += 1
                
                png_bytes = mermaid_to_png(mermaid_code)
                if png_bytes:
                    img = XLImage(BytesIO(png_bytes))
                    img.width = 400
                    img.height = 200
                    ws_diagram.add_image(img, f'A{row}')
                    row += 15
        except Exception as e:
            print(f"프로세스 다이어그램 생성 실패: {e}")
        
        # 2. 부서 간 데이터 흐름 다이어그램
        try:
            mermaid_code = generate_interaction_mermaid(data)
            if mermaid_code:
                ws_diagram[f'A{row}'] = '🔗 부서 간 데이터 흐름'
                row += 1
                
                png_bytes = mermaid_to_png(mermaid_code)
                if png_bytes:
                    img = XLImage(BytesIO(png_bytes))
                    img.width = 400
                    img.height = 200
                    ws_diagram.add_image(img, f'A{row}')
                    row += 15
        except Exception as e:
            print(f"상호작용 다이어그램 생성 실패: {e}")
        
        # 3. 의사결정 포인트 다이어그램
        try:
            mermaid_code = generate_decision_mermaid(data)
            if mermaid_code:
                ws_diagram[f'A{row}'] = '⚡ 의사결정 포인트'
                row += 1
                
                png_bytes = mermaid_to_png(mermaid_code)
                if png_bytes:
                    img = XLImage(BytesIO(png_bytes))
                    img.width = 400
                    img.height = 200
                    ws_diagram.add_image(img, f'A{row}')
                    row += 15
        except Exception as e:
            print(f"의사결정 다이어그램 생성 실패: {e}")
        
        # Sheet 2: 의사결정 포인트 테이블
        ws_decisions = wb.create_sheet("의사결정")
        ws_decisions['A1'] = "⚡ 의사결정 포인트"
        
        row = 3
        ws_decisions[f'A{row}'] = "포인트"
        ws_decisions[f'B{row}'] = "심각도"
        ws_decisions[f'C{row}'] = "설명"
        row += 1
        
        if 'critical_decision_points' in data:
            for decision in data['critical_decision_points']:
                ws_decisions[f'A{row}'] = decision.get('point_name', '')
                ws_decisions[f'B{row}'] = decision.get('severity', '')
                ws_decisions[f'C{row}'] = decision.get('description', '')
                row += 1
        
        # Sheet 3: 리스크 포인트 테이블
        ws_risks = wb.create_sheet("리스크")
        ws_risks['A1'] = "⚠️ 리스크 포인트"
        
        row = 3
        ws_risks[f'A{row}'] = "리스크"
        ws_risks[f'B{row}'] = "심각도"
        ws_risks[f'C{row}'] = "완화방법"
        row += 1
        
        if 'risk_points' in data:
            for risk in data['risk_points']:
                ws_risks[f'A{row}'] = risk.get('point_name', '')
                ws_risks[f'B{row}'] = risk.get('severity', '')
                ws_risks[f'C{row}'] = risk.get('mitigation', '')
                row += 1
        
        # Sheet 4: 개선 기회 테이블
        ws_improvements = wb.create_sheet("개선")
        ws_improvements['A1'] = "💡 개선 기회"
        
        row = 3
        ws_improvements[f'A{row}'] = "영역"
        ws_improvements[f'B{row}'] = "우선순위"
        ws_improvements[f'C{row}'] = "예상효과"
        row += 1
        
        if 'improvement_opportunities' in data:
            for improvement in data['improvement_opportunities']:
                ws_improvements[f'A{row}'] = improvement.get('area', '')
                ws_improvements[f'B{row}'] = improvement.get('priority', '')
                ws_improvements[f'C{row}'] = improvement.get('impact', '')
                row += 1
        
        # 열 너비 조정
        for ws in [ws_diagram, ws_decisions, ws_risks, ws_improvements]:
            ws.column_dimensions['A'].width = 30
            ws.column_dimensions['B'].width = 15
            ws.column_dimensions['C'].width = 40
        
        filename = f"통합분석_{integration_id[:8]}.xlsx"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        
        wb.save(filepath)
        
        return FileResponse(
            filepath,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel 다운로드 실패: {str(e)}")
