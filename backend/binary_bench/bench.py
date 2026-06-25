#!/usr/bin/env python3
"""Measure the binary tier against the labeled benchmark.

Nothing here is asserted; every number is computed from scan_binary() vs the
hand-built ground_truth.json. Reports:

  1. Binary-level precision/recall/F1 under two operating policies:
       STRICT      — count a detection only at HIGH confidence (Tier A imports).
       OPERATIONAL — also count LOW-confidence static-presence flags.
  2. The same, broken down by the variant cell (linkage x stripped) — this is where
     the honest story lives: where each policy works and where it fails.
  3. Family-attribution accuracy on the HIGH-confidence (dynamic) subset.

Run:  python3 bench.py   (optionally  --json out.json)
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))  # import app.*

from app.scanners.binary import scan_binary  # noqa: E402

GROUND_TRUTH = HERE / "ground_truth.json"
BIN = HERE / "bin"


def prf(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
    p = tp / (tp + fp) if (tp + fp) else 0.0
    r = tp / (tp + fn) if (tp + fn) else 0.0
    f = 2 * p * r / (p + r) if (p + r) else 0.0
    return p, r, f


def confusion(rows: list[dict], predict) -> dict:
    tp = fp = fn = tn = 0
    for row in rows:
        gt = row["present_asymmetric"]
        pred = predict(row)
        if gt and pred:
            tp += 1
        elif gt and not pred:
            fn += 1
        elif not gt and pred:
            fp += 1
        else:
            tn += 1
    p, r, f = prf(tp, fp, fn)
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": round(p, 3), "recall": round(r, 3), "f1": round(f, 3)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", type=Path)
    args = ap.parse_args()

    gt = json.loads(GROUND_TRUTH.read_text())

    # Run the scanner once per binary; cache the finding alongside ground truth.
    rows = []
    for g in gt:
        path = BIN / g["binary"]
        if not path.exists():
            continue
        finding = scan_binary(str(path))
        rows.append({**g,
                     "pred_detected": finding.detected,
                     "pred_confidence": finding.confidence,
                     "pred_families": finding.families,
                     "pred_high": finding.confidence == "high"})

    strict = lambda r: r["pred_high"]
    operational = lambda r: r["pred_detected"]

    print(f"\n{'='*68}\n BINARY TIER — BENCHMARK ({len(rows)} binaries, "
          f"{sum(r['present_asymmetric'] for r in rows)} positive)\n{'='*68}")

    print("\n## Overall\n")
    print(f"{'policy':14s} {'P':>6} {'R':>6} {'F1':>6}   tp/fp/fn/tn")
    out = {"overall": {}, "by_cell": {}, "family": {}}
    for name, fn in [("STRICT", strict), ("OPERATIONAL", operational)]:
        c = confusion(rows, fn)
        out["overall"][name] = c
        print(f"{name:14s} {c['precision']:>6} {c['recall']:>6} {c['f1']:>6}   "
              f"{c['tp']}/{c['fp']}/{c['fn']}/{c['tn']}")

    # --- by cell (linkage x stripped) ---------------------------------------
    print("\n## By cell (linkage / stripped)  — STRICT | OPERATIONAL recall\n")
    print(f"{'cell':22s} {'n':>3} {'pos':>3}  {'strictR':>8} {'operR':>8} {'operP':>8}")
    cells = defaultdict(list)
    for r in rows:
        cells[(r["linkage"], "stripped" if r["stripped"] else "symbols")].append(r)
    for key in sorted(cells):
        sub = cells[key]
        pos = sum(s["present_asymmetric"] for s in sub)
        cs = confusion(sub, strict)
        co = confusion(sub, operational)
        label = f"{key[0]}/{key[1]}"
        out["by_cell"][label] = {"n": len(sub), "pos": pos,
                                 "strict": cs, "operational": co}
        print(f"{label:22s} {len(sub):>3} {pos:>3}  {cs['recall']:>8} "
              f"{co['recall']:>8} {co['precision']:>8}")

    # --- by toolchain (call out Go specifically) -----------------------------
    print("\n## By toolchain  — OPERATIONAL P / R\n")
    print(f"{'toolchain':12s} {'n':>3} {'pos':>3}  {'operP':>7} {'operR':>7}")
    tool = defaultdict(list)
    for r in rows:
        bucket = {"go": "go", "mingw": "windows-pe"}.get(r["compiler"], "c/c++")
        tool[bucket].append(r)
    for key in sorted(tool):
        sub = tool[key]
        pos = sum(s["present_asymmetric"] for s in sub)
        co = confusion(sub, operational)
        out.setdefault("by_toolchain", {})[key] = {"n": len(sub), "pos": pos, "operational": co}
        print(f"{key:12s} {len(sub):>3} {pos:>3}  {co['precision']:>7} {co['recall']:>7}")

    # --- family attribution on HIGH-confidence subset -----------------------
    print("\n## Family attribution (HIGH-confidence / dynamic detections only)\n")
    fam_tot = fam_ok = 0
    misses = []
    for r in rows:
        if not (r["present_asymmetric"] and r["pred_high"]):
            continue
        fam_tot += 1
        # ECDSA/ECDH imply ECC; accept the specific family or ECC as correct.
        want = set(r["families"]) | ({"ECC"} if r["families"][0] in {"ECDSA", "ECDH", "ECC"} else set())
        got = set(r["pred_families"])
        if got & want:
            fam_ok += 1
        else:
            misses.append((r["binary"], r["families"], r["pred_families"]))
    acc = round(fam_ok / fam_tot, 3) if fam_tot else 0.0
    out["family"] = {"n": fam_tot, "correct": fam_ok, "accuracy": acc}
    print(f"correct {fam_ok}/{fam_tot}  accuracy {acc}")
    for m in misses[:10]:
        print(f"   MISS {m[0]}  want={m[1]} got={m[2]}")

    # --- the honest blind spot: confident-but-wrong negatives ---------------
    blind = [r["binary"] for r in rows
             if r["present_asymmetric"] and not r["pred_detected"]]
    print(f"\n## Undetected positives (the recall holes): {len(blind)}")
    for bname in blind:
        print(f"   MISS {bname}")

    if args.json:
        args.json.write_text(json.dumps(out, indent=2) + "\n")
        print(f"\nwrote {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
