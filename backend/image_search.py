import re
from html import unescape

import httpx

from backend.schemas import ImageCandidate

COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"


def build_commons_params(query: str, limit: int) -> dict[str, str | int]:
    return {
        "action": "query",
        "format": "json",
        "origin": "*",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": max(1, min(limit, 12)),
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
        "iiurlwidth": "360",
    }


async def search_commons_images(query: str, limit: int = 6) -> list[ImageCandidate]:
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get(COMMONS_API_URL, params=build_commons_params(query, limit))
        response.raise_for_status()
        payload = response.json()

    pages = payload.get("query", {}).get("pages", {})
    candidates: list[ImageCandidate] = []

    for page in sorted(pages.values(), key=lambda item: item.get("index", 0)):
        image_info = (page.get("imageinfo") or [{}])[0]
        mime = str(image_info.get("mime", ""))
        if mime and not mime.startswith("image/"):
            continue

        image_url = image_info.get("url")
        thumbnail_url = image_info.get("thumburl") or image_url
        source_url = image_info.get("descriptionurl")
        if not image_url or not thumbnail_url or not source_url:
            continue

        metadata = image_info.get("extmetadata") or {}
        candidates.append(
            ImageCandidate(
                id=str(page.get("pageid")),
                title=clean_title(str(page.get("title", ""))),
                image_url=str(image_url),
                thumbnail_url=str(thumbnail_url),
                source_url=str(source_url),
                credit=clean_html(metadata.get("Artist", {}).get("value")),
                license=clean_html(metadata.get("LicenseShortName", {}).get("value")),
                license_url=metadata.get("LicenseUrl", {}).get("value"),
            )
        )

    return candidates


def clean_title(title: str) -> str:
    title = title.removeprefix("File:")
    return re.sub(r"\.[A-Za-z0-9]+$", "", title).replace("_", " ").strip()


def clean_html(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None

    text = re.sub(r"<[^>]+>", "", value)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip() or None
