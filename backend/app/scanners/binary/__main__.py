"""CLI: scan a binary / directory / artifact for quantum-vulnerable crypto.

    python -m app.scanners.binary <path> [--cbom out.json] [--json]

Prints a per-binary report; with --cbom, writes a CycloneDX 1.6 CBOM. Runs with no
database and no network, so it works in CI and on an analyst's laptop.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from uuid import uuid4

from .artifact import scan_path
from .cbom import to_cbom


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m app.scanners.binary")
    ap.add_argument("path", help="binary file, or directory/tree of binaries")
    ap.add_argument("--cbom", metavar="FILE", help="write a CycloneDX CBOM here")
    ap.add_argument("--json", action="store_true", help="emit findings as JSON")
    args = ap.parse_args(argv)

    scan = scan_path(args.path)
    summary = scan.summary()

    if args.json:
        print(json.dumps({"summary": summary,
                          "findings": [f.to_dict() for f in scan.detected]}, indent=2))
    else:
        print(f"\nScanned {summary['binaries_scanned']} binaries under {args.path!r}")
        print(f"  quantum-vulnerable: {summary['vulnerable_binaries']} "
              f"({summary['high_confidence']} high / {summary['low_confidence']} low confidence)")
        print(f"  families: {summary['families'] or '—'}\n")
        for f in scan.detected:
            name = f.path.rsplit("/", 1)[-1]
            print(f"  [{f.confidence:>4}] {','.join(f.families) or 'asymmetric':22s} "
                  f"{f.detection_via:13s} {name}")

    if args.cbom:
        bom = to_cbom(scan,
                      serial_number=f"urn:uuid:{uuid4()}",
                      timestamp=datetime.now(timezone.utc).isoformat())
        with open(args.cbom, "w") as fh:
            json.dump(bom, fh, indent=2)
        print(f"\nwrote CBOM ({len(bom['components'])} crypto components) -> {args.cbom}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
