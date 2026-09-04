from __future__ import annotations

import argparse

import build_wander_photos as builder


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset", required=True)
    args = parser.parse_args()

    matches = [item for item in builder.ITEMS if item[0] == args.asset]
    if len(matches) != 1:
        choices = ", ".join(item[0] for item in builder.ITEMS)
        raise SystemExit(f"Unknown asset {args.asset!r}. Choices: {choices}")

    builder.ITEMS = matches
    builder.BATCH_SIZE = 1
    builder.process_batch(0)


if __name__ == "__main__":
    main()
