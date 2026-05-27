from pathlib import Path
from docx import Document
import pdfplumber

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = Document(file_path)
        paragraphs = [paragraph.text for paragraph in doc.paragraphs]
        return "\n".join(paragraphs)
    except Exception as e:
        raise Exception(f"Word 파일에서 텍스트 추출 중 오류 발생: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    try:
        text_list = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_list.append(text)
        return "\n".join(text_list)
    except Exception as e:
        raise Exception(f"PDF 파일에서 텍스트 추출 중 오류 발생: {str(e)}")

def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        raise Exception(f"TXT 파일에서 텍스트 추출 중 오류 발생: {str(e)}")

def extract_text(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise ValueError(f"파일을 찾을 수 없습니다: {file_path}")
        
    ext = path.suffix.lower()
    if ext == '.docx' or ext == '.doc':
        text = extract_text_from_docx(file_path)
    elif ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.txt', '.log']:
        text = extract_text_from_txt(file_path)
    else:
        raise ValueError(f"지원하지 않는 파일 확장자입니다: {ext}")
        
    if not text.strip():
        raise ValueError("추출된 텍스트가 비어 있습니다.")
        
    return text
