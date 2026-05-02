from collections.abc import Awaitable
from pathlib import Path
from typing import Annotated
from urllib.parse import quote

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from backend.generators import (
    make_dobble_pptx,
    make_flicker_pptx,
    make_word_search_docx,
    make_worksheet_docx,
)
from backend.image_search import search_images
from backend.schemas import (
    DobbleRequest,
    FlickerRequest,
    ImageProvider,
    ImageSearchResponse,
    WordSearchRequest,
    WorksheetRequest,
)

app = FastAPI(title="Worksheet Maker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/images/search")
async def image_search(
    query: Annotated[str, Query(min_length=1)],
    limit: Annotated[int, Query(ge=1, le=12)] = 6,
    provider: Annotated[ImageProvider, Query()] = "auto",
) -> ImageSearchResponse:
    try:
        results = await search_images(query, limit, provider)
    except Exception as exc:  # noqa: BLE001 - map upstream failure to API error
        raise HTTPException(
            status_code=502,
            detail="사진 검색 서버에 연결할 수 없습니다.",
        ) from exc

    return ImageSearchResponse(query=query, provider=provider, results=results)


@app.post("/api/materials/flicker.pptx")
async def create_flicker(request: FlickerRequest) -> Response:
    return await generated_file(
        "단어깜빡이.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        make_flicker_pptx(request),
    )


@app.post("/api/materials/dobble.pptx")
async def create_dobble(request: DobbleRequest) -> Response:
    return await generated_file(
        "도블카드.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        make_dobble_pptx(request),
    )


@app.post("/api/materials/worksheet.docx")
async def create_worksheet(request: WorksheetRequest) -> Response:
    return await generated_file(
        "단어활동지.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        make_worksheet_docx(request),
    )


@app.post("/api/materials/word-search.docx")
async def create_word_search(request: WordSearchRequest) -> Response:
    return await generated_file(
        "낱말찾기.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        make_word_search_docx(request),
    )


async def generated_file(filename: str, media_type: str, content: Awaitable[bytes]) -> Response:
    body = await content
    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"},
    )


def mount_static_assets(application: FastAPI) -> None:
    dist_dir = Path(__file__).resolve().parent.parent / "dist"
    if dist_dir.exists():
        application.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")


mount_static_assets(app)
