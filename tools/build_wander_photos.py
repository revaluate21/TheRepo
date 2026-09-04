from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import random
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat

API = "https://commons.wikimedia.org/w/api.php"
UA = "WanderPortugal/2.2 (real-photo PWA bundle; github.com/revaluate21/TheRepo)"
OUT = Path("assets/photos")
CREDITS_PATH = Path("wander/photo-credits.json")
STATUS_PATH = Path("wander/photo-status.json")
BATCH_SIZE = 7

ITEMS = [
    ("belem.jpg", "Belém Tower (Torre de Belém) 1.jpg", "Belém Tower Lisbon exterior"),
    ("bica.jpg", "Elevador da Bica - Lisbon (52750990701).jpg", "Elevador da Bica Lisbon street"),
    ("boca-vento.jpg", "Elevador da Boca do Vento, Almada - panoramio.jpg", "Boca do Vento Almada Lisbon view"),
    ("boca.jpg", "Boca do Inferno, Cascais.jpg", "Boca do Inferno Cascais cliffs"),
    ("cais.jpg", "Cais do Sodre, Lisbon (DSC03382).jpg", "Cais do Sodré Lisbon"),
    ("carmo.jpg", "Lisbon, the Convento do Carmo.JPG", "Convento do Carmo Lisbon ruins"),
    ("coimbra.jpg", "Portugal 120716 Coimbra University 07.jpg", "University of Coimbra courtyard"),
    ("cristo.jpg", "Cristo Rei, Almada 39.jpg", "Cristo Rei Almada Lisbon view"),
    ("evora.jpg", "Roman-Temple-Evora.jpg", "Roman Temple Évora Portugal"),
    ("graca.jpg", "Miradouro da Graça.jpg", "Miradouro da Graça Lisbon"),
    ("guincho.jpg", "Praia do Guincho (cropped).JPG", "Praia do Guincho Cascais Atlantic"),
    ("joanina.jpg", "Biblioteca Joanina (53560470042).jpg", "Biblioteca Joanina Coimbra"),
    ("maat.jpg", "MAAT - The Museum of Art, Architecture and Technology (33806654791).jpg", "MAAT Lisbon exterior"),
    ("monserrate.jpg", "The Palace of Monserrate in Sintra National Park (27954800241).jpg", "Monserrate Palace Sintra garden"),
    ("mouros.jpg", "The Moorish Castle, Sintra, Portugal (27954846141).jpg", "Moorish Castle Sintra walls"),
    ("obidos.jpg", "The Óbidos' Castle (4017081137).jpg", "Óbidos castle walls Portugal"),
    ("oriente.jpg", "Gare do Oriente.jpg", "Gare do Oriente Lisbon architecture"),
    ("parque.jpg", "Parque Eduardo VII - Lisbon (52750120427).jpg", "Parque Eduardo VII Lisbon view"),
    ("pena.jpg", "Pena Palace, Sintra, Portugal, 20250606 1019 9978.jpg", "Pena Palace Sintra colourful exterior"),
    ("pink.jpg", "Lisbon Pink Street.jpg", "Pink Street Lisbon Rua Nova do Carvalho"),
    ("praca.jpg", "Praça do Comércio – Lisboa, Portugal (54817271215).jpg", "Praça do Comércio Lisbon square"),
    ("regaleira.jpg", "Quinta da Regaleira 01.jpg", "Quinta da Regaleira Sintra palace"),
    ("rossio.jpg", "Rossio Square Lisbon Portugal.jpg", "Rossio Square Lisbon"),
    ("santa-luzia.jpg", "St. Lucy - Miradouro de Santa Luzia - Lisbon (52751066335).jpg", "Miradouro Santa Luzia Lisbon tiles"),
    ("sao-pedro.jpg", "Miradouro de São Pedro de Alcântara (13943471369).jpg", "São Pedro de Alcântara Lisbon viewpoint"),
    ("se.jpg", "Sé de Lisboa (Lisbon Cathedral) 112.jpg", "Lisbon Cathedral Sé exterior"),
    ("senhora.jpg", "Miradouro da Senhora do Monte (38530147244).jpg", "Senhora do Monte Lisbon viewpoint"),
    ("tomar.jpg", "Convent of Christ - Tomar.jpg", "Convent of Christ Tomar Portugal"),
]


def retry_open(request: urllib.request.Request, *, timeout: int = 75, attempts: int = 9):
    for attempt in range(attempts):
        try:
            return urllib.request.urlopen(request, timeout=timeout)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == attempts - 1:
                raise
            header = error.headers.get("Retry-After")
            wait = float(header) if header and header.isdigit() else min(120, 12 * (attempt + 1))
            wait += random.uniform(0.5, 2.0)
            print(f"HTTP {error.code}; backing off {wait:.1f}s", flush=True)
            time.sleep(wait)
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            time.sleep(min(90, 8 * (attempt + 1)) + random.uniform(0.5, 1.5))
    raise RuntimeError("request retry loop exhausted")


def api(params: dict, *, post: bool = False) -> dict:
    encoded = urllib.parse.urlencode(params)
    if post:
        request = urllib.request.Request(
            API,
            data=encoded.encode(),
            headers={"User-Agent": UA, "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
        )
    else:
        request = urllib.request.Request(API + "?" + encoded, headers={"User-Agent": UA, "Accept": "application/json"})
    with retry_open(request, timeout=50) as response:
        return json.load(response)


def normalise_title(value: str) -> str:
    value = value.removeprefix("File:").replace("_", " ")
    return unicodedata.normalize("NFKC", value).casefold().strip()


def similarity(candidate: str, wanted: str, query: str) -> float:
    from difflib import SequenceMatcher

    candidate_norm = normalise_title(candidate)
    wanted_norm = normalise_title(wanted)
    words = {word for word in re.findall(r"[\wÀ-ÿ]+", query.casefold()) if len(word) > 3}
    return SequenceMatcher(None, candidate_norm, wanted_norm).ratio() + sum(word in candidate_norm for word in words) * 0.09


def resolve_batch(batch: list[tuple[str, str, str]]) -> dict[str, tuple[dict, dict]]:
    base = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "redirects": "1",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": "1600",
    }
    titles = "|".join("File:" + title for _, title, _ in batch)
    result = api({**base, "titles": titles}, post=True)
    pages = {
        normalise_title(page.get("title", "")): page
        for page in result.get("query", {}).get("pages", [])
        if page.get("imageinfo") and not page.get("missing")
    }
    resolved: dict[str, tuple[dict, dict]] = {}
    for asset, title, query in batch:
        page = pages.get(normalise_title(title))
        if page:
            resolved[asset] = (page, page["imageinfo"][0])
            continue
        print(f"Exact title unresolved; searching {title}", flush=True)
        search = api({**base, "generator": "search", "gsrsearch": query, "gsrnamespace": "6", "gsrlimit": "20", "gsrwhat": "text"})
        candidates = []
        for candidate in search.get("query", {}).get("pages", []):
            infos = candidate.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            if info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
                continue
            if min(info.get("width", 0), info.get("height", 0)) < 700:
                continue
            candidates.append((similarity(candidate.get("title", ""), title, query), candidate, info))
        if not candidates:
            raise RuntimeError(f"No Commons image found for {title}")
        _, page, info = max(candidates, key=lambda item: item[0])
        resolved[asset] = (page, info)
    return resolved


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/webp,image/*,*/*;q=.8"})
    with retry_open(request) as response:
        data = response.read()
    if len(data) < 50_000:
        raise RuntimeError(f"downloaded image was only {len(data)} bytes")
    return data


def clean_metadata(value: str | None) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", value).strip()


def process_batch(batch_index: int) -> None:
    start = batch_index * BATCH_SIZE
    batch = ITEMS[start : start + BATCH_SIZE]
    if not batch:
        raise SystemExit(f"No batch {batch_index}")

    OUT.mkdir(parents=True, exist_ok=True)
    resolved = resolve_batch(batch)
    existing_credits = {item["asset"]: item for item in json.loads(CREDITS_PATH.read_text())} if CREDITS_PATH.exists() else {}
    status = json.loads(STATUS_PATH.read_text()) if STATUS_PATH.exists() else {"real_photo_bundle": False, "photos": {}}

    for index, (asset, wanted, _) in enumerate(batch, start=1):
        page, info = resolved[asset]
        print(f"Batch {batch_index + 1}/4 · {index}/{len(batch)} · {asset} ← {page.get('title')}", flush=True)
        raw = download(info.get("thumburl") or info["url"])
        with Image.open(io.BytesIO(raw)) as source:
            source = ImageOps.exif_transpose(source).convert("RGB")
            original = source.size
            image = ImageOps.fit(source, (1280, 800), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        gray = image.resize((160, 100)).convert("L")
        stddev = ImageStat.Stat(gray).stddev[0]
        entropy = gray.entropy()
        low, high = gray.getextrema()
        if stddev < 18 or entropy < 4.4 or high - low < 75:
            raise RuntimeError(f"{asset} failed photographic-detail validation")
        output = OUT / asset
        image.save(output, "JPEG", quality=88, optimize=True, progressive=True, subsampling=1)
        if output.stat().st_size < 80_000:
            raise RuntimeError(f"{asset} compressed to only {output.stat().st_size} bytes")

        metadata = info.get("extmetadata") or {}
        actual = page.get("title", "File:" + wanted).removeprefix("File:")
        author = clean_metadata((metadata.get("Artist") or {}).get("value")) or "Wikimedia Commons contributor"
        license_name = clean_metadata((metadata.get("LicenseShortName") or {}).get("value")) or clean_metadata((metadata.get("UsageTerms") or {}).get("value")) or "See source"
        source_url = "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(actual.replace(" ", "_"), safe="()_',-–")
        existing_credits[asset] = {"asset": asset, "title": actual, "author": author, "license": license_name, "source": source_url}
        status["photos"][asset] = {
            "title": actual,
            "bytes": output.stat().st_size,
            "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
            "original": original,
            "stddev": round(stddev, 2),
            "entropy": round(entropy, 3),
        }
        time.sleep(3.2 + random.uniform(0.4, 1.2))

    ordered_credits = [existing_credits[asset] for asset, _, _ in ITEMS if asset in existing_credits]
    CREDITS_PATH.write_text(json.dumps(ordered_credits, ensure_ascii=False, indent=2), encoding="utf-8")
    status["generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    status["real_photo_bundle"] = len(status["photos"]) == len(ITEMS)
    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")


def finalise() -> None:
    credits = json.loads(CREDITS_PATH.read_text())
    status = json.loads(STATUS_PATH.read_text())
    if len(credits) != len(ITEMS) or len(status.get("photos", {})) != len(ITEMS):
        raise RuntimeError("photo metadata is incomplete")

    hashes = set()
    thumbs = []
    for asset, _, _ in ITEMS:
        path = OUT / asset
        if not path.exists() or path.stat().st_size < 80_000:
            raise RuntimeError(f"missing or tiny photo: {asset}")
        with Image.open(path) as image:
            if image.size != (1280, 800):
                raise RuntimeError(f"wrong dimensions for {asset}: {image.size}")
            gray = image.resize((160, 100)).convert("L")
            if ImageStat.Stat(gray).stddev[0] < 18 or gray.entropy() < 4.4:
                raise RuntimeError(f"flat/non-photographic file: {asset}")
            thumbs.append((asset, image.copy().resize((320, 200), Image.Resampling.LANCZOS)))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in hashes:
            raise RuntimeError(f"duplicate photograph: {asset}")
        hashes.add(digest)

    rows = "".join(
        f'<li><b>{html.escape(item["asset"])}</b> — <a href="{html.escape(item["source"])}">{html.escape(item["title"])}</a>, {html.escape(item["author"])}, {html.escape(item["license"])}</li>'
        for item in credits
    )
    Path("wander/photo-credits.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wander photograph credits</title><style>body{font:16px system-ui;max-width:900px;margin:auto;padding:24px;line-height:1.55;background:#fffdf7;color:#161b35}a{color:#6847e8}li{margin:10px 0}</style><h1>Wander Portugal — photograph credits</h1><p>Photographs were resized and centre-cropped. Open each source for the original and complete licence.</p><ol>' + rows + "</ol>",
        encoding="utf-8",
    )

    sheet = Image.new("RGB", (1600, 1410), "white")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)
    for index, (asset, thumb) in enumerate(thumbs):
        x = (index % 5) * 320
        y = (index // 5) * 235
        sheet.paste(thumb, (x, y))
        draw.rectangle((x, y + 200, x + 320, y + 235), fill="white")
        draw.text((x + 8, y + 207), asset, fill=(20, 25, 45), font=font)
    Path("/tmp").mkdir(exist_ok=True)
    sheet.save("/tmp/wander-real-photo-contact-sheet.jpg", "JPEG", quality=90, optimize=True)
    status["real_photo_bundle"] = True
    status["validated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Validated 28 unique, detailed, local real-world photographs.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int)
    parser.add_argument("--finalise", action="store_true")
    args = parser.parse_args()
    if args.finalise:
        finalise()
    elif args.batch is not None:
        process_batch(args.batch)
    else:
        parser.error("choose --batch or --finalise")


if __name__ == "__main__":
    main()
