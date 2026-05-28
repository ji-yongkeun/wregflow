import sys
import os

# backend 경로를 모듈 검색 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.db.database import engine

def check_db():
    print("=== PostgreSQL DB Connection & Schema Check ===")
    try:
        # DB 에코(로그 출력) 끄기
        engine.echo = False
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Connected successfully! Tables found ({len(tables)}):")
        
        with engine.connect() as connection:
            for table_name in tables:
                print(f"\nTable: {table_name}")
                # 컬럼 정보 출력
                columns = inspector.get_columns(table_name)
                cols_str = ", ".join([f"{col['name']} ({col['type']})" for col in columns])
                print(f"  Columns: {cols_str}")
                
                # 로우 수 출력
                try:
                    res = connection.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = res.scalar()
                    print(f"  Row Count: {count}")
                except Exception as e:
                    print(f"  Error getting row count: {e}")
                    
    except Exception as e:
        print(f"Database connection error: {e}")

if __name__ == "__main__":
    check_db()
