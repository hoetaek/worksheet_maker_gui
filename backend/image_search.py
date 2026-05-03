import re
from html import unescape

import httpx

from backend.schemas import ImageCandidate, ImageProvider

COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"
MYMEMORY_TRANSLATE_API_URL = "https://api.mymemory.translated.net/get"
IMAGE_REQUEST_HEADERS = {
    "User-Agent": "worksheet-maker-gui/1.0 (local development; https://github.com/hoetaek/worksheet_maker_gui)",
    "Api-User-Agent": "worksheet-maker-gui/1.0",
}
SEARCH_SUFFIXES = {
    "gif",
    "image",
    "jpeg",
    "jpg",
    "photo",
    "pic",
    "picture",
    "png",
    "svg",
    "webp",
    "그림",
    "사진",
    "이미지",
}
KOREAN_PATTERN = re.compile(r"[가-힣]")
ENGLISH_PATTERN = re.compile(r"[A-Za-z]")
TRANSLATION_WARNING_PATTERN = re.compile(r"(quota|warning|invalid|error)", re.IGNORECASE)


async def search_images(
    query: str,
    limit: int = 6,
    provider: ImageProvider = "auto",
) -> list[ImageCandidate]:
    results, _searched_query = await search_images_with_query(query, limit, provider)
    return results


async def search_images_with_query(
    query: str,
    limit: int = 6,
    provider: ImageProvider = "auto",
) -> tuple[list[ImageCandidate], str]:
    candidates: list[ImageCandidate] = []
    seen: set[str] = set()
    searched_query = query

    for current_query in await build_image_search_queries(query):
        for current_provider in provider_order(current_query, provider):
            for candidate in await provider_search(current_provider, current_query, limit):
                dedupe_key = candidate.image_url
                if dedupe_key in seen:
                    continue

                if not candidates:
                    searched_query = current_query
                seen.add(dedupe_key)
                candidates.append(candidate)
                if len(candidates) >= limit:
                    return candidates, searched_query

    return candidates, searched_query


def provider_order(query: str, provider: ImageProvider) -> list[ImageProvider]:
    if provider == "auto":
        if KOREAN_PATTERN.search(query):
            return ["commons", "openverse"]

        return ["openverse", "commons"]

    return [provider, secondary_provider(provider)]


def secondary_provider(provider: ImageProvider) -> ImageProvider:
    return "commons" if provider != "commons" else "openverse"


async def provider_search(
    provider: ImageProvider,
    query: str,
    limit: int,
) -> list[ImageCandidate]:
    if provider == "commons":
        return await search_commons_images(query, limit)

    return await search_openverse_images(query, limit)


def build_search_queries(query: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", query).strip()
    if not normalized:
        return []

    queries = [normalized]
    parts = normalized.split(" ")
    while len(parts) > 1 and parts[-1].lower().lstrip(".") in SEARCH_SUFFIXES:
        parts = parts[:-1]
        cleaned = " ".join(parts).strip()
        if cleaned:
            queries.append(cleaned)

    return list(dict.fromkeys(queries))


async def build_image_search_queries(query: str) -> list[str]:
    queries = build_search_queries(query)
    translated_queries: list[str] = []

    for current_query in queries:
        translated = await translate_korean_query_to_english(current_query)
        if translated:
            translated_queries.append(translated)

    return list(dict.fromkeys([*translated_queries, *queries]))


async def translate_korean_query_to_english(query: str) -> str | None:
    if not KOREAN_PATTERN.search(query):
        return None

    try:
        async with httpx.AsyncClient(
            timeout=5,
            headers=IMAGE_REQUEST_HEADERS,
            follow_redirects=True,
        ) as client:
            response = await client.get(
                MYMEMORY_TRANSLATE_API_URL,
                params={"q": query, "langpair": "ko|en"},
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError:
        return None

    if not isinstance(payload, dict):
        return None

    response_data = payload.get("responseData")
    if not isinstance(response_data, dict):
        return None

    translated = string_or_none(response_data.get("translatedText"))
    if not translated:
        return None

    cleaned = re.sub(r"\s+", " ", translated).strip(" .")
    if (
        not ENGLISH_PATTERN.search(cleaned)
        or KOREAN_PATTERN.search(cleaned)
        or TRANSLATION_WARNING_PATTERN.search(cleaned)
    ):
        return None

    return cleaned.lower()


def build_openverse_params(query: str, limit: int) -> dict[str, str | int]:
    return {
        "q": query,
        "page_size": max(1, min(limit, 12)),
        "license_type": "commercial,modification",
    }


async def search_openverse_images(query: str, limit: int = 6) -> list[ImageCandidate]:
    async with httpx.AsyncClient(
        timeout=12,
        headers=IMAGE_REQUEST_HEADERS,
        follow_redirects=True,
    ) as client:
        response = await client.get(OPENVERSE_API_URL, params=build_openverse_params(query, limit))
        response.raise_for_status()
        payload = response.json()

    return normalize_openverse_images(payload)


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
    async with httpx.AsyncClient(
        timeout=12,
        headers=IMAGE_REQUEST_HEADERS,
        follow_redirects=True,
    ) as client:
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
                provider="commons",
                credit=clean_html(metadata.get("Artist", {}).get("value")),
                license=clean_html(metadata.get("LicenseShortName", {}).get("value")),
                license_url=metadata.get("LicenseUrl", {}).get("value"),
            )
        )

    return candidates


def normalize_openverse_images(payload: object) -> list[ImageCandidate]:
    if not isinstance(payload, dict):
        return []

    raw_results = payload.get("results")
    if not isinstance(raw_results, list):
        return []

    candidates: list[ImageCandidate] = []
    for item in raw_results:
        if not isinstance(item, dict):
            continue

        image_url = item.get("url")
        thumbnail_url = item.get("thumbnail") or image_url
        source_url = item.get("foreign_landing_url")
        identifier = item.get("id")
        title = item.get("title") or "사진"
        if not all(
            isinstance(value, str) and value for value in [image_url, source_url, identifier]
        ):
            continue

        candidates.append(
            ImageCandidate(
                id=f"openverse:{identifier}",
                title=str(title),
                image_url=str(image_url),
                thumbnail_url=str(thumbnail_url),
                source_url=str(source_url),
                provider="openverse",
                credit=string_or_none(item.get("creator")),
                license=format_openverse_license(item),
                license_url=string_or_none(item.get("license_url")),
            )
        )

    return candidates


def format_openverse_license(item: dict[object, object]) -> str | None:
    license_code = string_or_none(item.get("license"))
    if not license_code:
        return None

    version = string_or_none(item.get("license_version"))
    label = f"CC {license_code.upper()}" if license_code.lower() != "pdm" else "Public Domain"
    return f"{label} {version}" if version else label


def string_or_none(value: object) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()

    return None


def clean_title(title: str) -> str:
    title = title.removeprefix("File:")
    return re.sub(r"\.[A-Za-z0-9]+$", "", title).replace("_", " ").strip()


def clean_html(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None

    text = re.sub(r"<[^>]+>", "", value)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip() or None
