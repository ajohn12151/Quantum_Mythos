"""Recover Go function names from the gopclntab — covers `-s -w` stripped Go.

`go build -ldflags="-s -w"` removes the standard symbol table (and DWARF), which is
what defeats Tier A's normal symbol path on stripped Go binaries. But the Go runtime
*always* embeds the pcln table (gopclntab): it needs function names at runtime for
stack traces and panics, so it survives stripping. The funcname table inside it is a
blob of NUL-terminated strings — one per function — which is exactly the
`crypto/ecdsa.*` / `crypto/rsa.*` evidence Tier A wants.

We don't need addresses (no reachability on stripped Go — Go DCE already implies a
retained symbol is callable), only the names, so we parse just the header + funcname
blob, not the full functab/pcdata. Section-independent: we locate the table by its
magic header and validate it (`runtime.` must appear in the funcname blob), so it
works whether or not a `__gopclntab` section name survived.

Format refs (runtime/symtab.go `pcHeader`):
  magic uint32 ; pad uint16 ; minLC uint8 ; ptrSize uint8 ; then ptrSize-wide fields:
    nfunc, nfiles, [textStart (Go 1.18+)], funcnameOffset, cuOffset, ...
  funcname table = [base+funcnameOffset, base+cuOffset); offsets are from the header.
"""
from __future__ import annotations

from pathlib import Path

# magic (little-endian bytes) -> has the textStart field (Go 1.18+)
_MAGICS = {
    b"\xf1\xff\xff\xff": True,   # Go 1.20+
    b"\xf0\xff\xff\xff": True,   # Go 1.18 / 1.19
    b"\xfa\xff\xff\xff": False,  # Go 1.16 / 1.17
    # 0xfffffffb (Go 1.2-1.15) uses a different funcname layout; rare today, skipped.
}


def recover_go_funcnames(path: str) -> set[str]:
    """Return every function name in the binary's gopclntab, or empty set."""
    try:
        data = Path(path).read_bytes()
    except OSError:
        return set()
    for magic, has_textstart in _MAGICS.items():
        off = data.find(magic)
        while off != -1:
            names = _parse_at(data, off, has_textstart)
            if names is not None:
                return names
            off = data.find(magic, off + 1)
    return set()


def _parse_at(data: bytes, off: int, has_textstart: bool) -> set[str] | None:
    if off + 8 > len(data):
        return None
    if data[off + 4] != 0 or data[off + 5] != 0:        # pad bytes
        return None
    min_lc, ptr = data[off + 6], data[off + 7]
    if min_lc not in (1, 2, 4) or ptr not in (4, 8):
        return None

    def rd(field_off: int) -> int:
        return int.from_bytes(data[off + field_off:off + field_off + ptr], "little")

    base = 8
    if has_textstart:
        funcname_off, cu_off = rd(base + 3 * ptr), rd(base + 4 * ptr)
    else:
        funcname_off, cu_off = rd(base + 2 * ptr), rd(base + 3 * ptr)

    if not (0 < funcname_off < cu_off <= len(data) - off):
        return None
    blob = data[off + funcname_off:off + cu_off]
    if b"runtime." not in blob:          # confirm this is really the pcln table
        return None
    return {n.decode("utf-8", "ignore") for n in blob.split(b"\x00") if n} or None
