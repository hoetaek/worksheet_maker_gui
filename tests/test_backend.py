from io import BytesIO
from zipfile import ZipFile

from docx import Document
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_flicker_endpoint_returns_pptx() -> None:
    response = client.post(
        "/api/materials/flicker.pptx",
        json={
            "items": [{"word": "cat"}, {"word": "dog"}],
            "templates": ["word", "blank"],
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
    assert response.content[:2] == b"PK"
    with ZipFile(BytesIO(response.content)) as archive:
        assert "[Content_Types].xml" in archive.namelist()
        assert "ppt/presentation.xml" in archive.namelist()


def test_worksheet_endpoint_returns_docx() -> None:
    response = client.post(
        "/api/materials/worksheet.docx",
        json={
            "items": [{"word": "토끼"}, {"word": "거북이"}],
            "columns": 2,
            "grade": 3,
            "class_number": 1,
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert response.content[:2] == b"PK"
    assert "_______" not in docx_text(response.content)
    assert "학년" in docx_text(response.content)
    assert "반" in docx_text(response.content)
    assert "이름" in docx_text(response.content)


def test_word_search_endpoint_returns_premium_docx_without_underscore_name_field() -> None:
    response = client.post(
        "/api/materials/word-search.docx",
        json={
            "words": ["토끼", "사자"],
            "grid": [["토", "끼"], ["사", "자"]],
            "hints": [{"word": "토끼"}, {"word": "사자"}],
            "grade": 3,
            "class_number": 1,
            "title": "낱말 찾기",
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    text = docx_text(response.content)
    assert "_______" not in text
    assert "학년" in text
    assert "반" in text
    assert "이름" in text


def test_image_search_validates_query() -> None:
    response = client.get("/api/images/search", params={"query": "", "limit": 3})

    assert response.status_code == 422


def docx_text(content: bytes) -> str:
    document = Document(BytesIO(content))
    parts = [paragraph.text for paragraph in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            parts.extend(cell.text for cell in row.cells)
    return "\n".join(parts)
