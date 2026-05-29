import requests

def test_api():
    url = "http://localhost:8001/api/regulations/analyze"
    # To test this we need a file_id that exists in the uploads folder.
    # We wiped the db and uploads folder, so we must upload a file first.
    
    upload_url = "http://localhost:8001/api/regulations/upload"
    files = {'file': ('test.txt', '무역금융 신청 및 거래 외국환은행 지정 (포괄금융의 경우 주거래 외국환은행 지정) 한다. 이후 필요 서류 제출 (수출신용장, 수출계약서, 사업자등록증 등)을 한다.', 'text/plain')}
    data = {'edition': 1, 'edition_name': '1편'}
    
    r_upload = requests.post(upload_url, files=files, data=data)
    print("Upload response:", r_upload.json())
    
    filename = r_upload.json().get("filename")
    if filename:
        print(f"Analyzing {filename}...")
        r_analyze = requests.post(f"{url}?file_id={filename}")
        print("Analyze response:")
        import json
        print(json.dumps(r_analyze.json(), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_api()
