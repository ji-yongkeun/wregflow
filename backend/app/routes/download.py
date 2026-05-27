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

router = APIRouter(prefix="/api/download", tags=["download"])

@router.get("/integration/{integration_id}/word")
async def download_integration_as_word(
    integration_id: str,
    db: Session = Depends(get_db)
):
    """
    통합 분석 결과를 Word 문서로 다운로드
    """
    try:
        # 통합 분석 조회
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        # Word 문서 생성
        doc = Document()
        
        # 제목
        title = doc.add_heading(f'🎯 {integration.group_name}', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # 메타정보
        meta_para = doc.add_paragraph()
        meta_para.add_run('생성일시: ').bold = True
        meta_para.add_run(integration.created_at.strftime('%Y-%m-%d %H:%M:%S'))
        
        meta_para2 = doc.add_paragraph()
        meta_para2.add_run('설명: ').bold = True
        meta_para2.add_run(integration.description or '(없음)')
        
        # 각 섹션
        data = integration.integrated_data
        
        if data:
            # 1. 통합 프로세스
            if 'integrated_process' in data:
                doc.add_heading('📊 통합 프로세스 흐름', level=1)
                process = data['integrated_process']
                if 'steps' in process:
                    for step in process['steps']:
                        p = doc.add_paragraph(style='List Bullet')
                        p.add_run(f"Step {step.get('step_number', '')} - {step.get('step_name', '')}").bold = True
                        p.add_run(f" ({step.get('responsible_department', '')})")
                doc.add_paragraph()
            
            # 2. 부서 간 데이터 흐름
            if 'department_interactions' in data:
                doc.add_heading('🔗 부서 간 데이터 흐름', level=1)
                interactions = data['department_interactions']
                for inter in interactions:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{inter.get('from_dept', '')} → {inter.get('to_dept', '')}").bold = True
                    p.add_run(f": {inter.get('data_flow', '')}")
                doc.add_paragraph()
            
            # 3. 의사결정 포인트
            if 'critical_decision_points' in data:
                doc.add_heading('⚡ 의사결정 포인트', level=1)
                decisions = data['critical_decision_points']
                for decision in decisions:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{decision.get('point_name', '')}").bold = True
                    p.add_run(f" ({decision.get('severity', 'Medium')} Impact)")
                    doc.add_paragraph(decision.get('description', ''), style='List Bullet 2')
                doc.add_paragraph()
            
            # 4. 리스크 포인트
            if 'risk_points' in data:
                doc.add_heading('⚠️ 리스크 포인트', level=1)
                risks = data['risk_points']
                for risk in risks:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{risk.get('point_name', '')} - {risk.get('severity', '')}").bold = True
                    doc.add_paragraph(f"완화방법: {risk.get('mitigation', '')}", style='List Bullet 2')
                doc.add_paragraph()
            
            # 5. 개선 기회
            if 'improvement_opportunities' in data:
                doc.add_heading('💡 개선 기회', level=1)
                improvements = data['improvement_opportunities']
                for improvement in improvements:
                    p = doc.add_paragraph(style='List Bullet')
                    p.add_run(f"{improvement.get('area', '')} - {improvement.get('priority', 'Medium')}").bold = True
                    doc.add_paragraph(f"예상효과: {improvement.get('impact', '')}", style='List Bullet 2')
        
        # 파일 저장 (tempfile 임시 디렉토리 사용으로 Windows 대응)
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
    통합 분석 결과를 Excel로 다운로드
    """
    try:
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        # Excel 워크북 생성
        wb = Workbook()
        ws = wb.active
        ws.title = "통합분석"
        
        # 헤더
        ws['A1'] = f"🎯 {integration.group_name}"
        ws['A1'].font = ws['A1'].font.copy()
        ws['A1'].font = ws['A1'].font.copy()
        ws['A1'].font = ws['A1'].font.copy()
        
        ws['A2'] = f"생성: {integration.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
        
        row = 4
        data = integration.integrated_data
        
        if data:
            # 의사결정 포인트 테이블
            if 'critical_decision_points' in data:
                ws[f'A{row}'] = "⚡ 의사결정 포인트"
                row += 1
                
                ws[f'A{row}'] = "포인트"
                ws[f'B{row}'] = "심각도"
                ws[f'C{row}'] = "설명"
                row += 1
                
                for decision in data['critical_decision_points']:
                    ws[f'A{row}'] = decision.get('point_name', '')
                    ws[f'B{row}'] = decision.get('severity', '')
                    ws[f'C{row}'] = decision.get('description', '')
                    row += 1
                
                row += 2
            
            # 리스크 포인트 테이블
            if 'risk_points' in data:
                ws[f'A{row}'] = "⚠️ 리스크 포인트"
                row += 1
                
                ws[f'A{row}'] = "리스크"
                ws[f'B{row}'] = "심각도"
                ws[f'C{row}'] = "완화방법"
                row += 1
                
                for risk in data['risk_points']:
                    ws[f'A{row}'] = risk.get('point_name', '')
                    ws[f'B{row}'] = risk.get('severity', '')
                    ws[f'C{row}'] = risk.get('mitigation', '')
                    row += 1
                
                row += 2
            
            # 개선 기회 테이블
            if 'improvement_opportunities' in data:
                ws[f'A{row}'] = "💡 개선 기회"
                row += 1
                
                ws[f'A{row}'] = "영역"
                ws[f'B{row}'] = "우선순위"
                ws[f'C{row}'] = "예상효과"
                row += 1
                
                for improvement in data['improvement_opportunities']:
                    ws[f'A{row}'] = improvement.get('area', '')
                    ws[f'B{row}'] = improvement.get('priority', '')
                    ws[f'C{row}'] = improvement.get('impact', '')
                    row += 1
        
        # 열 너비 조정
        ws.column_dimensions['A'].width = 30
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 40
        
        # 파일 저장 (tempfile 임시 디렉토리 사용으로 Windows 대응)
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
