from __future__ import annotations

import argparse
import random
import time
import urllib.parse
import urllib.request

import build_wander_photos as builder


def proxy_download(source_url: str) -> bytes:
    # Wikimedia's upload CDN heavily rate-limits shared CI addresses. The
    # one-time image proxy fetches that same licensed source and returns a
    # resized JPEG; the finished asset is then stored locally in this repo.
    proxy = "https://wsrv.nl/?" + urllib.parse.urlencode({
        "url": source_url,
        "w": "1600",
        "output": "jpg",
        "q": "90",
        "we": "1",
    })
    request = urllib.request.Request(
        proxy,
        headers={
            "User-Agent": "WanderPortugal/2.2 (one-time licensed photo import)",
            "Accept": "image/jpeg,image/*,*/*;q=.8",
        },
    )
    last_error: Exception | None = None
    for attempt in range(7):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            if len(data) < 50_000:
                raise RuntimeError(f"proxy returned only {len(data)} bytes")
            return data
        except Exception as error:
            last_error = error
            if attempt == 6:
                break
            time.sleep(min(50, 5 * (attempt + 1)) + random.uniform(.3, 1.2))
    raise RuntimeError(f"proxied photograph download failed: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset", required=True)
    args = parser.parse_args()

    indexes = [index for index, item in enumerate(builder.ITEMS) if item[0] == args.asset]
    if len(indexes) != 1:
        raise SystemExit(f"Unknown asset: {args.asset}")

    builder.download = proxy_download
    builder.BATCH_SIZE = 1
    builder.process_batch(indexes[0])


if __name__ == "__main__":
    main()
