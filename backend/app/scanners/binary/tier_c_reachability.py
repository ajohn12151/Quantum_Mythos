"""Tier C — call-graph reachability (turns static "present" into "used").

Reuses QED's Phase-3 idea (arXiv:2409.07852): once a quantum-vulnerable API is
known to be linked in, ask whether the program's own code actually *reaches* it,
rather than treating mere linkage as use. This is what resolves the static
over-linking false positives that Tiers A/B cannot (a binary that statically links
libcrypto for AES/SHA also drags in all the RSA/EC machinery — present, never
called).

Scope and honesty:
  - Needs FUNCTION SYMBOLS WITH ADDRESSES and a `.text` section, i.e. it works on
    static-UNSTRIPPED binaries. On stripped binaries there are no symbols to anchor
    the graph, so Tier C cannot run and we fall back to presence (Tier A/B).
  - Builds a DIRECT-call graph only (x86-64 `call`, arm64 `bl`, plus tail
    `jmp`/`b` into a known function head). Indirect calls (call rax / blr, PLT
    thunks, provider function-pointer dispatch) are NOT resolved. This makes Tier C
    CONSERVATIVE toward *over*-reaching: it will not invent a path. It can therefore
    MISS a genuine path that exists only through indirect dispatch — which is why a
    negative Tier C result downgrades confidence rather than asserting safety.
  - Family attribution comes from family-named APIs the program calls directly
    (EVP_PKEY_CTX_set_rsa_keygen_bits, EC_KEY_new_by_curve_name, ECDSA_*, ...),
    which our reachability from `main` recovers precisely.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

import capstone
import lief

from .qv_apis import match_families
from .tier_a_symbols import normalize

try:
    lief.logging.disable()
except Exception:
    pass


@dataclass
class TierCResult:
    ran: bool = False                                 # could we build a graph at all?
    reachable_families: dict[str, list[str]] = field(default_factory=dict)
    reached_qv: bool = False                          # any QV function reachable from root?
    present_qv: bool = False                          # any QV function defined at all
    root: str = ""                                    # entry used (main / entrypoint)
    note: str = ""


def _disassembler(b):
    """Return (capstone.Cs, arch_kind) for the binary, or (None, None)."""
    fmt = getattr(b.format, "name", str(b.format)).upper()
    is_arm = "AARCH64" in (getattr(b.header, "machine_type", "") and str(b.header.machine_type)).upper() \
        or "ARM64" in str(getattr(b.header, "cpu_type", "")).upper()
    # Robust arch sniff across ELF/Mach-O:
    machine = str(getattr(b.header, "machine_type", "")) + str(getattr(b.header, "cpu_type", ""))
    machine = machine.upper()
    if "AARCH64" in machine or "ARM64" in machine:
        arch = getattr(capstone, "CS_ARCH_AARCH64", getattr(capstone, "CS_ARCH_ARM64", None))
        md = capstone.Cs(arch, capstone.CS_MODE_LITTLE_ENDIAN)
        return md, "arm64"
    if "X86_64" in machine or "X86" in machine or "AMD64" in machine:
        md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
        return md, "x86_64"
    return None, None


def _text_section(b):
    for sec in b.sections:
        if sec.name in (".text", "__text"):
            return int(sec.virtual_address), bytes(sec.content)
    return None, None


def _functions(b) -> dict[str, tuple[int, int]]:
    """normalized name -> (addr, size) for defined symbols that carry an address."""
    out: dict[str, tuple[int, int]] = {}
    for s in b.symbols:
        addr = int(getattr(s, "value", 0) or 0)
        name = getattr(s, "name", "")
        if addr and name:
            out.setdefault(normalize(name), (addr, int(getattr(s, "size", 0) or 0)))
    return out


# Branch mnemonics that represent a call or tail-call we follow.
_CALL_MNEMONICS = {"call", "bl", "blx"}
_TAIL_MNEMONICS = {"jmp", "b"}


def analyze(path: str) -> TierCResult:
    try:
        b = lief.parse(path)
    except Exception:
        return TierCResult(note="parse failed")
    if b is None:
        return TierCResult(note="parse failed")

    md, arch = _disassembler(b)
    base, code = _text_section(b)
    funcs = _functions(b)
    if md is None or code is None or not funcs:
        return TierCResult(note="no disassembler/.text/symbols — cannot build graph")
    md.detail = False

    addr2name = {addr: name for name, (addr, _) in funcs.items()}
    func_heads = set(addr2name)
    res = TierCResult(ran=True)
    res.present_qv = bool(match_families(set(funcs)))

    # Mach-O symbols carry NO size, so a fixed disassembly window overshoots into the
    # next function and fuses the call graph (everything reaches everything). Derive
    # each function's extent from the gap to the next symbol address; this bounds the
    # window precisely on Mach-O and is harmless on ELF (real sizes take precedence).
    sorted_addrs = sorted(func_heads)
    next_addr = {a: sorted_addrs[i + 1] for i, a in enumerate(sorted_addrs[:-1])}
    text_end = base + len(code)
    MAX_FUNC_BYTES = 1 << 16

    def window_end(addr: int, size: int) -> int:
        if size:
            return addr + size
        return min(next_addr.get(addr, text_end), addr + MAX_FUNC_BYTES, text_end)

    # --- choose a root -------------------------------------------------------
    root = "main" if "main" in funcs else None
    if root is None:
        # fall back to the binary entry point if it maps to a known function
        ep = int(getattr(b, "entrypoint", 0) or 0)
        root = addr2name.get(ep)
    if root is None:
        res.note = "no main / resolvable entry point; cannot root reachability"
        return res
    res.root = root

    # --- LAZY BFS over the direct-call graph ---------------------------------
    # A statically linked binary contains all of libcrypto (~16k functions);
    # building the whole graph is wasteful. Disassemble a function only when the
    # BFS reaches it, and cap the number of expanded functions so a fan-out into
    # library internals can't run away. Our targets (family-named APIs the program
    # calls directly) are reached at shallow depth, so the cap never hides them.
    MAX_FUNCS = 4000

    def callees_of(name: str) -> set[str]:
        addr, size = funcs[name]
        off = addr - base
        if off < 0 or off >= len(code):
            return set()
        end = window_end(addr, size) - base
        out: set[str] = set()
        for ins in md.disasm(code[off:end], addr):
            if ins.mnemonic not in _CALL_MNEMONICS and ins.mnemonic not in _TAIL_MNEMONICS:
                continue
            # x86 direct call operand looks like "0x1234"; arm64 bl/b looks like
            # "#0x1234" — strip the ARM '#' immediate prefix before parsing.
            op = ins.op_str.strip().lstrip("#")
            if not op.startswith("0x"):
                continue  # register-indirect (call rax / blr x0) — unresolved
            try:
                tgt = int(op.split(",")[0], 16)
            except ValueError:
                continue
            if ins.mnemonic in _TAIL_MNEMONICS and tgt not in func_heads:
                continue
            callee = addr2name.get(tgt)
            if callee and callee != name:
                out.add(callee)
        return out

    seen = {root}
    dq = deque([root])
    expanded = 0
    while dq and expanded < MAX_FUNCS:
        cur = dq.popleft()
        expanded += 1
        for nxt in callees_of(cur):
            if nxt not in seen:
                seen.add(nxt)
                dq.append(nxt)
    capped = f"reachability capped at {MAX_FUNCS} functions; " if expanded >= MAX_FUNCS else ""

    fams = match_families(seen)
    res.reachable_families = fams
    res.reached_qv = bool(fams)
    if res.reached_qv:
        res.note = capped + f"QV API reachable from {root}: {sorted(fams)}"
    elif res.present_qv:
        res.note = capped + (f"asymmetric machinery is linked but NOT reachable from "
                             f"{root} via direct calls (likely dead/over-linked; "
                             "indirect paths unresolved — conservative)")
    else:
        res.note = capped + "no asymmetric machinery present"
    return res
