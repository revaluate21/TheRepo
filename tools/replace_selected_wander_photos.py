from __future__ import annotations

import argparse

import build_wander_photos as builder
from fetch_one_wander_photo_proxy import proxy_download

CURATED = {
    "bica.jpg": (
        "Yellow Elevador da Bica Funicular in Lisbon, Portugal (54715452370).jpg",
        "Yellow Elevador da Bica Lisbon funicular steep street",
    ),
    "parque.jpg": (
        "Parque Eduardo VII (Lisbon).jpg",
        "Parque Eduardo VII Lisbon panoramic hedge view Tagus",
    ),
    "praca.jpg": (
        "Praça do Comércio (Commerce Square) - Lisbon (52742691555).jpg",
        "Praça do Comércio Lisbon full yellow square river",
    ),
    "rossio.jpg": (
        "Lisboa, Rossio 3.jpg",
        "Rossio Square Lisbon fountain theatre night",
    ),
    "santa-luzia.jpg": (
        "Miradouro de Santa Luzia View over Alfama, Lisbon (54733651122).jpg",
        "Miradouro de Santa Luzia Lisbon Alfama Tagus panorama",
    ),
    "se.jpg": (
        "Sé-de-Lisboa facade.jpg",
        "Lisbon Cathedral Sé full front facade",
    ),
    "senhora.jpg": (
        "Panoramic View from Miradouro da Senhora do Monte in Lisbon (54742879994).jpg",
        "Senhora do Monte Lisbon panoramic city view",
    ),
}


def replace(asset: str) -> None:
    if asset not in CURATED:
        raise SystemExit(f"Unknown curated asset: {asset}")
    indices = [i for i, item in enumerate(builder.ITEMS) if item[0] == asset]
    if len(indices) != 1:
        raise SystemExit(f"Could not uniquely locate {asset}")
    index = indices[0]
    title, query = CURATED[asset]
    builder.ITEMS[index] = (asset, title, query)
    builder.download = proxy_download
    builder.BATCH_SIZE = 1
    builder.process_batch(index)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset", choices=sorted(CURATED), required=True)
    args = parser.parse_args()
    replace(args.asset)


if __name__ == "__main__":
    main()
