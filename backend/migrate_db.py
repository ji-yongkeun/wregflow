import os
import sys

# 백엔드 루트 디렉토리를 파이썬 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.analysis import AnalysisResult, AnalysisGroup
from sqlalchemy.orm.attributes import flag_modified

def replace_nulls(obj):
    changed = False
    
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'system_used' and v in [None, 'null', 'None', '', '시스템&수기']:
                obj[k] = '시스템/수기'
                changed = True
            elif isinstance(v, (dict, list)):
                if replace_nulls(v):
                    changed = True
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                if replace_nulls(item):
                    changed = True
                    
    return changed

def run_migration():
    db = SessionLocal()
    try:
        results = db.query(AnalysisResult).all()
        updated_count = 0
        for r in results:
            changed_swim = False
            changed_raci = False
            changed_decisions = False
            changed_system = False
            
            if r.swim_lanes:
                changed_swim = replace_nulls(r.swim_lanes)
                if changed_swim:
                    flag_modified(r, "swim_lanes")
            
            if r.raci:
                changed_raci = replace_nulls(r.raci)
                if changed_raci:
                    flag_modified(r, "raci")
                    
            if r.decisions:
                changed_decisions = replace_nulls(r.decisions)
                if changed_decisions:
                    flag_modified(r, "decisions")
                    
            if r.system_interfaces:
                changed_system = replace_nulls(r.system_interfaces)
                if changed_system:
                    flag_modified(r, "system_interfaces")
                    
            if changed_swim or changed_raci or changed_decisions or changed_system:
                updated_count += 1
                
        groups = db.query(AnalysisGroup).all()
        group_updated_count = 0
        for g in groups:
            if g.integrated_data:
                if replace_nulls(g.integrated_data):
                    flag_modified(g, "integrated_data")
                    group_updated_count += 1

        if updated_count > 0 or group_updated_count > 0:
            db.commit()
        print(f"Migration completed. Updated {updated_count} AnalysisResult records, {group_updated_count} AnalysisGroup records.")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
