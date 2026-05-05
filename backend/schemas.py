from typing import Literal

from pydantic import BaseModel, Field

ImageProvider = Literal["auto", "openverse", "commons"]


class ImageCandidate(BaseModel):
    id: str
    title: str
    image_url: str
    thumbnail_url: str
    source_url: str
    provider: ImageProvider
    credit: str | None = None
    license: str | None = None
    license_url: str | None = None


class ImageSearchResponse(BaseModel):
    query: str
    searched_query: str
    provider: ImageProvider
    results: list[ImageCandidate]


class WordImage(BaseModel):
    word: str = Field(min_length=1)
    image: str | None = None
    clue: str | None = None


class FlickerRequest(BaseModel):
    items: list[WordImage] = Field(min_length=1)
    templates: list[Literal["word", "image", "word-image", "blank"]] = Field(min_length=1)


class WorksheetRequest(BaseModel):
    items: list[WordImage] = Field(min_length=1)
    columns: int = Field(default=5, ge=1, le=8)
    syllables: bool = False
    grade: int = Field(default=3, ge=1, le=6)
    class_number: int = Field(default=1, ge=1)


class WordSearchRequest(BaseModel):
    words: list[str] = Field(min_length=1)
    grid: list[list[str]] = Field(min_length=1)
    hints: list[WordImage] = Field(default_factory=list)
    grade: int = Field(default=3, ge=1, le=6)
    class_number: int = Field(default=1, ge=1)
    title: str = "낱말 찾기"


class DobbleRequest(BaseModel):
    cards: list[list[WordImage]] = Field(min_length=1)
    pictures_per_card: int = Field(ge=3, le=8)
    display_mode: Literal["image-word", "image", "word"] = "image-word"
