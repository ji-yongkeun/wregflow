import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.analysis import AnalysisResult

db = SessionLocal()
try:
    results = db.query(AnalysisResult).limit(2).all()
    for r in results:
        print(f"ID: {r.id}, Process: {r.process_name}")
        print("Swimlanes type:", type(r.swim_lanes))
        print("Swimlanes data sample (first 1-2 items):")
        if isinstance(r.swim_lanes, list) and len(r.swim_lanes) > 0:
            for lane in r.swim_lanes[:2]:
                print(f"  Role: {lane.get('role')}")
                steps = lane.get('steps', [])
                print(f"  Steps count: {len(steps)}")
                if steps:
                    print(f"  First step: {steps[0]}")
        print("-" * 50)
finally:
    db.close()
