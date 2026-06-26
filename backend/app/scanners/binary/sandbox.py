"""Isolated scanning for UNTRUSTED binaries.

The scanners parse attacker-controlled bytes (LIEF is C++, capstone disassembles
arbitrary code, the gopclntab/curve-constant passes read raw file bytes). A
malicious input can therefore (a) hang — a crafted table or disassembly loop, (b)
crash — a LIEF segfault, or (c) exhaust memory. Running the scan in-process would
let any of those take down the API worker or the whole image scan.

This module runs scans in a pool of worker PROCESSES with:
  - a hard MEMORY cap per worker (RLIMIT_AS), so a bad input OOMs only its worker;
  - a per-binary wall-clock TIMEOUT, after which the result is abandoned;
  - crash isolation — a worker segfault surfaces as an error finding, not a crash.
Any failure becomes a BinaryFinding with `error` set and detected=False, so the
caller gets a complete, well-formed result set no matter how hostile the input.
"""
from __future__ import annotations

import os
from concurrent.futures import ProcessPoolExecutor, TimeoutError as FutureTimeout

from .scan import BinaryFinding, scan_binary

DEFAULT_TIMEOUT_S = 30
DEFAULT_MEM_MB = 3072


def _init_worker(mem_mb: int) -> None:
    try:
        import resource
        limit = mem_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (limit, limit))
    except Exception:
        pass   # resource limits are best-effort (not all platforms support RLIMIT_AS)


def _scan_to_dict(path: str) -> dict:
    return scan_binary(path).to_dict()


def _error_finding(path: str, reason: str) -> BinaryFinding:
    return BinaryFinding(path=path, fmt="unknown", detected=False, confidence="none",
                         detection_via="none", note=f"sandboxed scan failed: {reason}",
                         error=reason)


def scan_isolated(paths, *, timeout_s: int = DEFAULT_TIMEOUT_S,
                  mem_mb: int = DEFAULT_MEM_MB, max_workers: int | None = None
                  ) -> list[BinaryFinding]:
    """Scan each path in an isolated, resource-capped worker. Order is preserved;
    timeouts/crashes/OOM become error findings."""
    paths = list(paths)
    if not paths:
        return []
    workers = max_workers or min(8, (os.cpu_count() or 2))
    results: dict[str, BinaryFinding] = {}
    ex = ProcessPoolExecutor(max_workers=workers, initializer=_init_worker,
                             initargs=(mem_mb,))
    try:
        futures = {ex.submit(_scan_to_dict, p): p for p in paths}
        for fut, p in futures.items():
            try:
                results[p] = BinaryFinding(**fut.result(timeout=timeout_s))
            except FutureTimeout:
                results[p] = _error_finding(p, f"timeout after {timeout_s}s")
            except Exception as e:   # BrokenProcessPool (segfault/OOM-kill), pickling, etc.
                results[p] = _error_finding(p, f"{type(e).__name__}")
    finally:
        ex.shutdown(wait=False, cancel_futures=True)
    return [results.get(p, _error_finding(p, "no result")) for p in paths]


def safe_scan_binary(path: str, *, timeout_s: int = DEFAULT_TIMEOUT_S,
                     mem_mb: int = DEFAULT_MEM_MB) -> BinaryFinding:
    """Scan one binary in isolation."""
    return scan_isolated([path], timeout_s=timeout_s, mem_mb=mem_mb, max_workers=1)[0]
