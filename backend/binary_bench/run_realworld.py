#!/usr/bin/env python3
"""Score the binary tier against hand-labeled REAL-WORLD binaries.

Synthetic benchmark proves behavior on a controlled matrix; this proves it does
not fall apart on binaries we didn't compile. Labels are hand-verified (see
realworld/labels.json). If a binary is missing, run realworld/setup_realworld.sh.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from app.scanners.binary import scan_binary  # noqa: E402

RW = HERE / "realworld"


def main() -> int:
    labels = json.loads((RW / "labels.json").read_text())
    print(f"\n{'='*78}\n REAL-WORLD (hand-labeled)\n{'='*78}")
    print(f"{'binary':12s} {'truth':6s} {'pred':6s} {'conf':5s} {'ok':3s}  detail")
    tp = fp = fn = tn = 0
    missing = 0
    for lab in labels:
        path = RW / lab["binary"]
        if not path.exists():
            print(f"{lab['binary']:12s}  -- missing (run setup_realworld.sh)")
            missing += 1
            continue
        f = scan_binary(str(path))
        truth = lab["present_asymmetric"]
        pred = f.detected
        ok = "OK" if truth == pred else "XX"
        if truth and pred: tp += 1
        elif truth and not pred: fn += 1
        elif not truth and pred: fp += 1
        else: tn += 1
        detail = f"{f.detection_via} {f.families}" if pred else "(none)"
        print(f"{lab['binary']:12s} {str(truth):6s} {str(pred):6s} {f.confidence:5s} {ok:3s}  {detail}")

    print(f"\n  tp={tp} fp={fp} fn={fn} tn={tn}" + (f"  ({missing} missing)" if missing else ""))
    print("\n  Note: rw_docker is a Go static binary (self-implemented crypto, no")
    print("  OpenSSL). It is now DETECTED via the Go symbol path. A go build -s -w")
    print("  (fully stripped) Go binary would still be missed — the gopclntab gap.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
