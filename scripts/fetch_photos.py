#!/usr/bin/env python3
"""Download the app's credited Wikimedia Commons photos and create mobile-friendly JPEGs."""
from __future__ import annotations

import hashlib
import io
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "photo-sources.txt"
OUT = ROOT / "assets" / "photos"
STATUS = ROOT / "photo-status.json"
TARGET = (1280, 800)
USER_AGENT = "WanderPortugal/3.0 (photo bundler; contact via GitHub repository)"


def parse_sources() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for raw in SOURCES.read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        parts = raw.split("|", 4)
        if len(parts) != 5:
            raise ValueError(f"Bad source line: {raw}")
        slug, filename, author, license_name, source = parts
        rows.append({
            "slug": slug,
            "filename": filename,
            "author": author,
            "license": license_name,
            "source": source,
        })
    return rows


def image_url(session: requests.Session, filename: str) -> str:
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "prop": "imageinfo",
        "iiprop": "url|mime|size",
        "iiurlwidth": "1800",
        "titles": f"File:{filename}",
        "origin": "*",
    }
    response = session.get(
        "https://commons.wikimedia.org/w/api.php",
        params=params,
        timeout=45,
    )
    response.raise_for_status()
    payload = response.json()
    pages = payload.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        raise RuntimeError(f"Commons file not found: {filename}")
    info = (pages[0].get("imageinfo") or [{}])[0]
    url = info.get("thumburl") or info.get("url")
    if not url:
        raise RuntimeError(f"Commons did not return image URL: {filename}")
    return url


def download(session: requests.Session, filename: str) -> bytes:
    errors: list[str] = []
    try:
        url = image_url(session, filename)
        response = session.get(url, timeout=75)
        response.raise_for_status()
        if not response.headers.get("content-type", "").startswith("image/"):
            raise RuntimeError(f"Unexpected content type {response.headers.get('content-type')}")
        return response.content
    except Exception as exc:
        errors.append(f"API route: {exc}")

    # Fallback through Special:Redirect in case imageinfo is briefly unavailable.
    fallback = f"https://commons.wikimedia.org/wiki/Special:Redirect/file/{quote(filename, safe='')}?width=1800"
    try:
        response = session.get(fallback, timeout=75, allow_redirects=True)
        response.raise_for_status()
        if not response.headers.get("content-type", "").startswith("image/"):
            raise RuntimeError(f"Unexpected content type {response.headers.get('content-type')}")
        return response.content
    except Exception as exc:
        errors.append(f"redirect route: {exc}")
        raise RuntimeError("; ".join(errors)) from exc


def compose_mobile_jpeg(raw: bytes) -> bytes:
    with Image.open(io.BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")

    # Fill the full card with a softened version, then preserve the entire source
    # in the foreground. This avoids chopping off towers, palaces and monuments.
    background = ImageOps.fit(image, TARGET, method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(radius=18))
    background = ImageEnhance.Brightness(background).enhance(0.62)

    foreground = image.copy()
    foreground.thumbnail(TARGET, Image.Resampling.LANCZOS)
    x = (TARGET[0] - foreground.width) // 2
    y = (TARGET[1] - foreground.height) // 2
    background.paste(foreground, (x, y))

    output = io.BytesIO()
    background.save(output, format="JPEG", quality=84, optimize=True, progressive=True)
    return output.getvalue()



def make_icons() -> None:
    assets = ROOT / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        image = Image.new("RGB", (size, size), "#fff9eb")
        draw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).Draw(image)
        margin = int(size * 0.07)
        draw.rounded_rectangle(
            (margin, margin, size - margin, size - margin),
            radius=int(size * 0.22),
            fill="#ff4f86",
        )
        try:
            font = __import__("PIL.ImageFont", fromlist=["ImageFont"]).truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.52)
            )
        except Exception:
            font = __import__("PIL.ImageFont", fromlist=["ImageFont"]).load_default()
        bounds = draw.textbbox((0, 0), "W", font=font)
        tw, th = bounds[2] - bounds[0], bounds[3] - bounds[1]
        draw.text(((size - tw) / 2, (size - th) / 2 - int(size * 0.04)), "W", font=font, fill="white")
        draw.ellipse(
            (int(size * 0.72), int(size * 0.11), int(size * 0.91), int(size * 0.30)),
            fill="#ffbe3b",
            outline="white",
            width=max(3, int(size * 0.025)),
        )
        image.save(assets / f"icon-{size}.png", optimize=True)


def main() -> int:
    rows = parse_sources()
    make_icons()
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"})
    status: list[dict[str, object]] = []
    failures: list[str] = []

    for index, row in enumerate(rows, start=1):
        slug = row["slug"]
        path = OUT / f"{slug.replace('_', '-')}.jpg"
        print(f"[{index:02d}/{len(rows):02d}] {row['filename']}", flush=True)
        try:
            raw = download(session, row["filename"])
            final = compose_mobile_jpeg(raw)
            path.write_bytes(final)
            status.append({
                **row,
                "path": path.relative_to(ROOT).as_posix(),
                "bytes": len(final),
                "sha256": hashlib.sha256(final).hexdigest(),
            })
        except Exception as exc:
            failures.append(f"{row['filename']}: {exc}")
        time.sleep(0.18)

    payload = {
        "ok": not failures,
        "count": len(status),
        "expected": len(rows),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "photos": status,
        "failures": failures,
    }
    STATUS.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if failures:
        print("\nPhoto download failures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print(f"Bundled {len(status)} real photographs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
