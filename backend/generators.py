from base64 import b64decode
from collections.abc import Sequence
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

import httpx
from docx import Document
from docx.document import Document as DocxDocument
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt
from PIL import Image, UnidentifiedImageError
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN
from pptx.presentation import Presentation as PptxPresentation
from pptx.slide import Slide
from pptx.util import Inches
from pptx.util import Pt as PptPt

from backend.image_search import IMAGE_REQUEST_HEADERS
from backend.schemas import (
    DobbleRequest,
    FlickerRequest,
    WordSearchRequest,
    WorksheetRequest,
)


async def make_flicker_pptx(request: FlickerRequest) -> bytes:
    presentation = Presentation()
    presentation.slide_width = Inches(13.333)
    presentation.slide_height = Inches(7.5)

    for item in request.items:
        for template in request.templates:
            slide = presentation.slides.add_slide(presentation.slide_layouts[6])
            add_slide_frame(slide, item.word)

            if template in {"word", "word-image"}:
                add_center_text(slide, item.word, top=0.75 if template == "word-image" else 2.45)

            if template in {"image", "word-image"}:
                image = await resolve_image(item.image)
                if image:
                    add_image(slide, image, left=4.65, top=2.15, width=4.0, height=3.35)
                else:
                    add_placeholder(slide, "사진 없음")

            if template == "blank":
                add_center_text(slide, "", top=2.45)

    return save_presentation(presentation)


async def make_dobble_pptx(request: DobbleRequest) -> bytes:
    presentation = Presentation()
    presentation.slide_width = Inches(10)
    presentation.slide_height = Inches(10)

    for index, card in enumerate(request.cards):
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        add_small_label(slide, f"도블 카드 {index + 1}")
        positions = card_positions(len(card))
        for item, (left, top) in zip(card, positions, strict=False):
            image = await resolve_image(item.image)
            if image:
                add_image(slide, image, left=left, top=top, width=1.75, height=1.75)
            textbox = slide.shapes.add_textbox(
                Inches(left - 0.12),
                Inches(top + 1.78),
                Inches(2),
                Inches(0.32),
            )
            paragraph = textbox.text_frame.paragraphs[0]
            paragraph.text = item.word
            paragraph.alignment = PP_ALIGN.CENTER
            paragraph.font.size = PptPt(13)

    return save_presentation(presentation)


async def make_worksheet_docx(request: WorksheetRequest) -> bytes:
    document = Document()
    section = document.sections[0]
    section.top_margin = Cm(1)
    section.bottom_margin = Cm(0.8)
    section.left_margin = Cm(1.3)
    section.right_margin = Cm(1.3)

    heading = document.add_heading("단어 활동지", 0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_student_info(document, request.grade, request.class_number)

    rows = ((len(request.items) + request.columns - 1) // request.columns) * 2
    table = document.add_table(rows=rows, cols=request.columns, style="Table Grid")
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for row_index, row in enumerate(table.rows):
        for col_index, cell in enumerate(row.cells):
            item_index = (row_index // 2) * request.columns + col_index
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if item_index >= len(request.items):
                continue

            item = request.items[item_index]
            if row_index % 2 == 0:
                image = await resolve_image(item.image)
                if image:
                    paragraph.add_run().add_picture(image, width=Cm(3.0))
                else:
                    paragraph.add_run("사진 없음")
            else:
                text = split_syllables(item.word) if request.syllables else item.word
                run = paragraph.add_run(text)
                run.font.name = "Arial"
                run.font.size = Pt(15)
                run.bold = True

    return save_document(document)


async def make_word_search_docx(request: WordSearchRequest) -> bytes:
    document = Document()
    section = document.sections[0]
    section.top_margin = Cm(1)
    section.bottom_margin = Cm(0.8)
    section.left_margin = Cm(1.7)
    section.right_margin = Cm(1.7)

    heading = document.add_heading(request.title, 0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_student_info(document, request.grade, request.class_number)

    width = max(len(request.grid[0]), 1)
    table = document.add_table(rows=len(request.grid), cols=width, style="Table Grid")
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for row_index, row in enumerate(request.grid):
        for col_index, letter in enumerate(row):
            cell = table.rows[row_index].cells[col_index]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = paragraph.add_run(letter)
            run.bold = True

    if request.hints:
        document.add_paragraph("")
        hint_heading = document.add_paragraph("찾을 낱말")
        hint_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        hint_heading.runs[0].bold = True

        columns = min(4, len(request.hints))
        rows = (len(request.hints) + columns - 1) // columns
        hint_table = document.add_table(rows=rows, cols=columns, style="Table Grid")
        hint_table.alignment = WD_TABLE_ALIGNMENT.CENTER

        for row_index, row in enumerate(hint_table.rows):
            for col_index, cell in enumerate(row.cells):
                item_index = row_index * columns + col_index
                cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                if item_index >= len(request.hints):
                    continue

                item = request.hints[item_index]
                paragraph = cell.paragraphs[0]
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                image = await resolve_image(item.image)
                if image:
                    paragraph.add_run().add_picture(image, width=Cm(2.0))

                word_paragraph = cell.add_paragraph(item.word)
                word_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                word_run = word_paragraph.runs[0]
                word_run.font.size = Pt(11)
                word_run.bold = True

    return save_document(document)


async def make_zip(files: Sequence[tuple[str, bytes]]) -> bytes:
    buffer = BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        for name, content in files:
            archive.writestr(name, content)
    return buffer.getvalue()


async def resolve_image(value: str | None) -> BytesIO | None:
    if not value:
        return None

    if value.startswith("data:image/"):
        _, encoded = value.split(",", 1)
        return normalize_image(BytesIO(b64decode(encoded)))

    if value.startswith(("http://", "https://")):
        try:
            async with httpx.AsyncClient(
                timeout=15,
                headers=IMAGE_REQUEST_HEADERS,
                follow_redirects=True,
            ) as client:
                response = await client.get(value)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if not content_type.startswith("image/"):
                    return None
                return normalize_image(BytesIO(response.content))
        except (httpx.HTTPError, UnidentifiedImageError, OSError):
            return None

    return None


def normalize_image(image: BytesIO, size: tuple[int, int] = (800, 600)) -> BytesIO:
    image.seek(0)
    with Image.open(image) as source:
        source.thumbnail(size, Image.Resampling.LANCZOS)
        frame = Image.new("RGB", size, "#ffffff")

        if source.mode in {"RGBA", "LA"} or (
            source.mode == "P" and "transparency" in source.info
        ):
            normalized = source.convert("RGBA")
            position = ((size[0] - normalized.width) // 2, (size[1] - normalized.height) // 2)
            frame.paste(normalized, position, normalized)
        else:
            normalized = source.convert("RGB")
            position = ((size[0] - normalized.width) // 2, (size[1] - normalized.height) // 2)
            frame.paste(normalized, position)

    buffer = BytesIO()
    frame.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def add_slide_frame(slide: Slide, label: str) -> None:
    add_small_label(slide, label)
    line = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT,
        Inches(0.75),
        Inches(6.8),
        Inches(12.55),
        Inches(6.8),
    )
    line.line.color.rgb = RGBColor(235, 235, 235)  # type: ignore[no-untyped-call]


def add_small_label(slide: Slide, label: str) -> None:
    textbox = slide.shapes.add_textbox(Inches(0.55), Inches(0.35), Inches(4), Inches(0.35))
    paragraph = textbox.text_frame.paragraphs[0]
    paragraph.text = label
    paragraph.font.size = PptPt(11)
    paragraph.font.bold = True


def add_center_text(slide: Slide, text: str, top: float) -> None:
    textbox = slide.shapes.add_textbox(Inches(1.0), Inches(top), Inches(11.3), Inches(1.2))
    paragraph = textbox.text_frame.paragraphs[0]
    paragraph.text = text
    paragraph.alignment = PP_ALIGN.CENTER
    paragraph.font.size = PptPt(44)
    paragraph.font.bold = True


def add_placeholder(slide: Slide, text: str) -> None:
    textbox = slide.shapes.add_textbox(Inches(4.65), Inches(3.25), Inches(4), Inches(0.6))
    paragraph = textbox.text_frame.paragraphs[0]
    paragraph.text = text
    paragraph.alignment = PP_ALIGN.CENTER
    paragraph.font.size = PptPt(18)


def add_image(
    slide: Slide,
    image: BytesIO,
    left: float,
    top: float,
    width: float,
    height: float,
) -> None:
    image.seek(0)
    slide.shapes.add_picture(
        image,
        Inches(left),
        Inches(top),
        width=Inches(width),
        height=Inches(height),
    )


def card_positions(count: int) -> list[tuple[float, float]]:
    presets = {
        3: [(4.1, 1.1), (2.1, 5.25), (6.1, 5.25)],
        4: [(2.0, 1.35), (6.2, 1.35), (2.0, 5.4), (6.2, 5.4)],
        5: [(4.1, 0.9), (1.55, 3.1), (6.65, 3.1), (2.45, 6.3), (5.75, 6.3)],
        6: [(1.4, 1.25), (4.1, 1.25), (6.8, 1.25), (1.4, 5.65), (4.1, 5.65), (6.8, 5.65)],
        8: [
            (1.1, 1.0),
            (3.25, 1.0),
            (5.4, 1.0),
            (7.55, 1.0),
            (1.1, 5.75),
            (3.25, 5.75),
            (5.4, 5.75),
            (7.55, 5.75),
        ],
    }
    return presets.get(count, presets[6])


def split_syllables(word: str) -> str:
    return " · ".join(word)


def add_student_info(document: DocxDocument, grade: int, class_number: int) -> None:
    table = document.add_table(rows=1, cols=3, style="Table Grid")
    table.alignment = WD_TABLE_ALIGNMENT.RIGHT
    table.autofit = False

    fields = [
        ("학년", str(grade), Cm(2.0)),
        ("반", str(class_number), Cm(2.0)),
        ("이름", "", Cm(4.6)),
    ]
    for cell, (label, value, width) in zip(table.rows[0].cells, fields, strict=True):
        cell.width = width
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        label_run = paragraph.add_run(label)
        label_run.font.size = Pt(9)
        label_run.bold = True
        if value:
            value_run = paragraph.add_run(f" {value}")
            value_run.font.size = Pt(14)
            value_run.bold = True

    document.add_paragraph("")


def save_presentation(presentation: PptxPresentation) -> bytes:
    buffer = BytesIO()
    presentation.save(buffer)
    return buffer.getvalue()


def save_document(document: DocxDocument) -> bytes:
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()
