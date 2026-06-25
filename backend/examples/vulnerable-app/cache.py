"""Cache helpers for the Quantum Mythos white-box demo.

The md5 below is a legitimate, NON-security cache key (memoizing HTTP responses).
A naive SAST flags every md5() as a broken-hash vulnerability; the triage engine
should recognize the cache context and SUPPRESS it as a false positive. This is
the moat in one file: raw inventory -> trustworthy, reachability-ranked findings.
"""
import hashlib


def cache_key(url: str, params: dict) -> str:
    # Non-security cache/etag key: md5 is used only to memoize responses. Its
    # collision-resistance is irrelevant here — this is NOT a security hash.
    raw = url + repr(sorted(params.items()))
    return hashlib.md5(raw.encode()).hexdigest()
