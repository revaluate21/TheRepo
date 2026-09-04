from __future__ import annotations

import argparse

import build_wander_photos as builder


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset", required=True)
    args = parser.parse_args()

    indexes = [index for index, item in enumerate(builder.ITEMS) if item[0] == args.asset]
    if len(indexes) != 1:
        choices = ", ".join(item[0] for item in builder.ITEMS)
        raise SystemExit(f"Unknown asset {args.asset!r}. Choices: {choices}")

    # Keep the complete ITEMS list so process_batch preserves every existing
    # credit/status entry, but reduce this invocation to exactly one download.
    builder.BATCH_SIZE = 1
    builder.process_batch(indexes[0])


if __name__ == "__main__":
    main()
