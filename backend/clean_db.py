import os
import shutil
from pathlib import Path
from app.db.database import SessionLocal
from app.models.analysis import RegulationFile, AnalysisResult, AnalysisGroup
from app.models.version import AnalysisVersion
from app.models.share import Share

def clean_database():
    print("🧹 DB 및 업로드 파일 클렌징을 시작합니다...")
    
    db = SessionLocal()
    try:
        # 1. 운영/분석 데이터 삭제 (초기 세팅된 User 데이터는 건드리지 않음)
        deleted_versions = db.query(AnalysisVersion).delete()
        deleted_results = db.query(AnalysisResult).delete()
        deleted_groups = db.query(AnalysisGroup).delete()
        deleted_shares = db.query(Share).delete()
        deleted_files = db.query(RegulationFile).delete()
        
        db.commit()
        
        print(f"✅ [DB] AnalysisVersion (분석 버전) 삭제: {deleted_versions}건")
        print(f"✅ [DB] AnalysisResult (분석 결과) 삭제: {deleted_results}건")
        print(f"✅ [DB] AnalysisGroup (통합 분석) 삭제: {deleted_groups}건")
        print(f"✅ [DB] Share (공유 링크) 삭제: {deleted_shares}건")
        print(f"✅ [DB] RegulationFile (업로드 파일 메타) 삭제: {deleted_files}건")
        
    except Exception as e:
        db.rollback()
        print(f"❌ DB 클렌징 중 오류 발생: {e}")
    finally:
        db.close()
        
    # 2. 업로드된 실제 파일(물리적 파일) 삭제
    uploads_dir = Path("uploads")
    if uploads_dir.exists() and uploads_dir.is_dir():
        count = 0
        for item in uploads_dir.iterdir():
            if item.is_file() and item.name != ".gitkeep":
                item.unlink()
                count += 1
            elif item.is_dir():
                shutil.rmtree(item)
        print(f"✅ [File] uploads 폴더 내 실제 파일 삭제: {count}건")
    else:
        print("⚠️ uploads 폴더가 존재하지 않아 파일 삭제는 건너뜁니다.")
        
    print("🎉 클렌징이 완료되었습니다! (필수 초기 관리자/테스트 유저 데이터는 보존됨)")

if __name__ == "__main__":
    print("===========================================")
    print("⚠️ 경고: 초기 필수 데이터를 제외한 모든 분석/업로드 데이터를 삭제합니다.")
    print("===========================================")
    confirm = input("정말로 초기화하시겠습니까? (y/n): ")
    if confirm.lower() == 'y':
        clean_database()
    else:
        print("작업이 취소되었습니다.")
