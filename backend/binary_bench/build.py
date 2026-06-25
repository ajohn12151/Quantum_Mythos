#!/usr/bin/env python3
"""Build the labeled binary-tier benchmark.

Produces a variant matrix of real compiled binaries from corpus/*.c and writes
ground_truth.json. ELF (x86-64) is built in Docker (debian + OpenSSL) under
linux/amd64 emulation; Mach-O (arm64) is built natively with the host clang +
homebrew OpenSSL.

Variant axes exercised (these are exactly what defeats naive crypto detection):
  - compiler:  gcc vs clang
  - opt level: -O0 vs -O3
  - linkage:   dynamic (libcrypto.so/.dylib) vs static (libcrypto.a baked in)
  - symbols:   unstripped vs stripped

Ground truth is derived from the source file (we wrote it, so we know), NOT from
any detector. All precision/recall numbers in bench.py are measured against this.

Usage:
    python3 build.py            # build everything (ELF in docker + Mach-O native)
    python3 build.py --elf-only
    python3 build.py --macho-only
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CORPUS = HERE / "corpus"
CORPUS_GO = HERE / "corpus_go"
CORPUS_PE = HERE / "corpus_pe"
CORPUS_RUST = HERE / "corpus_rust"
BIN = HERE / "bin"
GROUND_TRUTH = HERE / "ground_truth.json"

DOCKER_IMAGE = "qm-binbench:amd64"
BREW = "/opt/homebrew/opt/openssl@3"

# --- ground-truth labels per source -----------------------------------------
# `present`: does the program perform Shor-vulnerable ASYMMETRIC crypto?
# `families`: which asymmetric primitive(s); empty for controls.
# Controls deliberately include ctrl_aes_sha, which DOES link libcrypto and run
# real (symmetric) crypto — the precision trap that must NOT read as shor_broken.
SOURCE_META = {
    "rsa_keygen":   {"present": True,  "families": ["RSA"]},
    "ec_keygen":    {"present": True,  "families": ["ECC"]},
    "ecdsa_sign":   {"present": True,  "families": ["ECDSA"]},
    "ecdh":         {"present": True,  "families": ["ECDH"]},
    "dh_keyex":     {"present": True,  "families": ["DH"]},
    "dsa_sign":     {"present": True,  "families": ["DSA"]},
    "ctrl_hello":   {"present": False, "families": []},
    "ctrl_aes_sha": {"present": False, "families": []},  # symmetric only
    "ctrl_fileio":  {"present": False, "families": []},
}

# --- variant matrices --------------------------------------------------------
# Each cell: (compiler, opt, linkage, stripped)
ELF_CELLS = [
    ("gcc",   "0", "dynamic", False),
    ("gcc",   "3", "dynamic", False),
    ("clang", "0", "dynamic", False),
    ("gcc",   "0", "dynamic", True),   # strip a dynamic binary: imports survive in .dynsym
    ("gcc",   "3", "static",  False),  # static + symbols: defined names in .symtab
    ("gcc",   "3", "static",  True),   # static + stripped: the blind cell (Tier A goes dark)
]
MACHO_CELLS = [
    ("clang", "0", "dynamic", False),
    ("clang", "3", "dynamic", False),
    ("clang", "0", "dynamic", True),
    ("clang", "3", "static",  False),
    ("clang", "3", "static",  True),
]


def variant_name(src: str, fmt: str, arch: str, compiler: str, opt: str,
                 linkage: str, stripped: bool) -> str:
    sym = "strip" if stripped else "sym"
    return f"{src}__{fmt}-{arch}__{compiler}-O{opt}__{linkage}__{sym}"


def sources() -> list[str]:
    return sorted(p.stem for p in CORPUS.glob("*.c"))


# --- ELF build (Docker, linux/amd64) ----------------------------------------
def build_elf(records: list[dict]) -> None:
    """Generate one bash script that builds every ELF cell, run it in the container."""
    lines = ["set -u", "cd /work", "mkdir -p bin", "fails=0"]
    planned: list[tuple[str, str, str, str, str, bool]] = []
    for src in sources():
        for compiler, opt, linkage, stripped in ELF_CELLS:
            name = variant_name(src, "elf", "x86_64", compiler, opt, linkage, stripped)
            out = f"bin/{name}"
            if linkage == "static":
                cc = (f"{compiler} -O{opt} -static corpus/{src}.c -o {out} "
                      f"-lssl -lcrypto -lpthread -ldl")
            else:
                cc = f"{compiler} -O{opt} corpus/{src}.c -o {out} -lssl -lcrypto"
            lines.append(f'if {cc} 2>/dev/null; then')
            if stripped:
                lines.append(f"  strip {out}")
            lines.append(f'  echo "OK {name}"')
            lines.append(f'else echo "FAIL {name}"; fails=$((fails+1)); fi')
            planned.append((src, compiler, opt, linkage, name, stripped))
    lines.append('echo "ELF build failures: $fails"')
    script = "\n".join(lines)

    print("=== building ELF matrix in Docker (linux/amd64) ===")
    proc = subprocess.run(
        ["docker", "run", "--rm", "-i", "--platform", "linux/amd64",
         "-v", f"{CORPUS}:/work/corpus:ro", "-v", f"{BIN}:/work/bin",
         DOCKER_IMAGE, "bash", "-s"],
        input=script, text=True, capture_output=True,
    )
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)

    built = {ln.split(" ", 1)[1] for ln in proc.stdout.splitlines() if ln.startswith("OK ")}
    for src, compiler, opt, linkage, name, stripped in planned:
        if name in built and (BIN / name).exists():
            records.append(_record(name, src, "elf", "x86_64", compiler, opt, linkage, stripped))


# --- Mach-O build (native) ---------------------------------------------------
def build_macho(records: list[dict]) -> None:
    if not Path(BREW).exists():
        print(f"!! homebrew openssl not at {BREW}; skipping Mach-O", file=sys.stderr)
        return
    print("=== building Mach-O matrix natively (arm64) ===")
    fails = 0
    for src in sources():
        for compiler, opt, linkage, stripped in MACHO_CELLS:
            name = variant_name(src, "macho", "arm64", compiler, opt, linkage, stripped)
            out = BIN / name
            cflags = [compiler, f"-O{opt}", str(CORPUS / f"{src}.c"),
                      f"-I{BREW}/include", "-o", str(out)]
            if linkage == "static":
                cflags += [f"{BREW}/lib/libssl.a", f"{BREW}/lib/libcrypto.a"]
            else:
                cflags += [f"-L{BREW}/lib", "-lssl", "-lcrypto"]
            r = subprocess.run(cflags, capture_output=True, text=True)
            if r.returncode != 0 or not out.exists():
                print(f"FAIL {name}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else '?'}")
                fails += 1
                continue
            if stripped:
                subprocess.run(["strip", "-x", str(out)], capture_output=True)
            print(f"OK {name}")
            records.append(_record(name, src, "macho", "arm64", compiler, opt, linkage, stripped))
    print(f"Mach-O build failures: {fails}")


# --- Go build (native; static; self-implemented crypto, no OpenSSL) ----------
# Go is the cloud-native reality: static, often "stripped". Its symbol = the
# package path (crypto/ecdsa.*), and the linker dead-code-eliminates unused
# packages, so symbol presence ~ use. `-s -w` removes the standard symbol table
# (the gopclntab-only case Tier A cannot yet read).
GO_SOURCE_META = {
    "go_ecdsa":     {"present": True,  "families": ["ECDSA"]},
    "go_rsa":       {"present": True,  "families": ["RSA"]},
    "go_ed25519":   {"present": True,  "families": ["Ed25519"]},
    "go_symmetric": {"present": False, "families": []},   # AES/SHA only
    "go_noncrypto": {"present": False, "families": []},
}


def build_go(records: list[dict]) -> None:
    if shutil.which("go") is None or not CORPUS_GO.exists():
        print("!! go toolchain or corpus_go missing; skipping Go", file=sys.stderr)
        return
    print("=== building Go matrix natively (arm64, static) ===")
    fails = 0
    for src, meta in GO_SOURCE_META.items():
        pkg = CORPUS_GO / src
        if not pkg.exists():
            continue
        for stripped in (False, True):
            sym = "strip" if stripped else "sym"
            name = f"{src}__macho-arm64__go__static__{sym}"
            cmd = ["go", "build", "-o", str(BIN / name)]
            if stripped:
                cmd += ["-ldflags", "-s -w"]
            cmd += ["./" + src]
            r = subprocess.run(cmd, cwd=CORPUS_GO, capture_output=True, text=True,
                               env={**__import__("os").environ, "CGO_ENABLED": "0"})
            if r.returncode != 0 or not (BIN / name).exists():
                print(f"FAIL {name}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else '?'}")
                fails += 1
                continue
            print(f"OK {name}")
            rec = _record(name, src, "macho", "arm64", "go", "0", "static", stripped)
            rec["present_asymmetric"] = meta["present"]
            rec["families"] = meta["families"]
            rec["source"] = f"{src}/main.go"
            records.append(rec)
    print(f"Go build failures: {fails}")


# --- Windows PE build (mingw-w64 cross-compile in Docker) --------------------
# Windows-native asymmetric crypto goes through CNG (bcrypt.dll). The imported
# function (BCryptGenerateKeyPair) says "asymmetric"; the family is the wide
# algorithm-id string (L"RSA", L"ECDSA_P256"). PE import tables survive `strip`,
# so both variants are detectable.
PE_SOURCE_META = {
    "pe_rsa":       {"present": True,  "families": ["RSA"]},
    "pe_ecdsa":     {"present": True,  "families": ["ECDSA"]},
    "pe_ecdh":      {"present": True,  "families": ["ECDH"]},
    "pe_symmetric": {"present": False, "families": []},   # CNG AES only
    "pe_noncrypto": {"present": False, "families": []},
}


def build_pe(records: list[dict]) -> None:
    if not CORPUS_PE.exists():
        return
    lines = ["set -u", "cd /work", "mkdir -p bin", "CC=x86_64-w64-mingw32-gcc",
             "STRIP=x86_64-w64-mingw32-strip"]
    planned = []
    for src in PE_SOURCE_META:
        if not (CORPUS_PE / f"{src}.c").exists():
            continue
        for stripped in (False, True):
            sym = "strip" if stripped else "sym"
            # mingw appends .exe unless the output name already ends in it, so name
            # the artifact with .exe to keep the on-disk file and the record in sync.
            name = f"{src}__pe-x86_64__mingw__dynamic__{sym}.exe"
            out = f"bin/{name}"
            lines.append(f'if $CC corpus_pe/{src}.c -o {out} -lbcrypt 2>/dev/null; then')
            if stripped:
                lines.append(f"  $STRIP {out}")
            lines.append(f'  echo "OK {name}"')
            lines.append(f'else echo "FAIL {name}"; fi')
            planned.append((src, name, stripped))
    script = "\n".join(lines)

    print("=== building Windows PE matrix (mingw-w64 in Docker) ===")
    proc = subprocess.run(
        ["docker", "run", "--rm", "-i", "--platform", "linux/amd64",
         "-v", f"{CORPUS_PE}:/work/corpus_pe:ro", "-v", f"{BIN}:/work/bin",
         DOCKER_IMAGE, "bash", "-s"],
        input=script, text=True, capture_output=True,
    )
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
    built = {ln.split(" ", 1)[1] for ln in proc.stdout.splitlines() if ln.startswith("OK ")}
    for src, name, stripped in planned:
        if name in built and (BIN / name).exists():
            meta = PE_SOURCE_META[src]
            rec = _record(name, src, "pe", "x86_64", "mingw", "0", "dynamic", stripped)
            rec["present_asymmetric"] = meta["present"]
            rec["families"] = meta["families"]
            rec["source"] = f"{src}.c"
            records.append(rec)


# --- Rust build (native; RustCrypto, static) --------------------------------
# Pure-Rust crypto (RustCrypto crates). Like Go, LLVM DCE means a retained crate
# symbol implies use. Unlike Go there is no pcln fallback, so a stripped Rust binary
# (no symbols, and measured: no curve constants either) is a genuine miss.
RUST_SOURCE_META = {
    "rust_rsa":       {"present": True,  "families": ["RSA"]},
    "rust_ecdsa":     {"present": True,  "families": ["ECDSA"]},
    "rust_ed25519":   {"present": True,  "families": ["Ed25519"]},
    "rust_symmetric": {"present": False, "families": []},   # AES-GCM + SHA only
    "rust_noncrypto": {"present": False, "families": []},
}


def build_rust(records: list[dict]) -> None:
    if shutil.which("cargo") is None or not CORPUS_RUST.exists():
        print("!! cargo or corpus_rust missing; skipping Rust", file=sys.stderr)
        return
    print("=== building Rust matrix natively (arm64, release) ===")
    r = subprocess.run(["cargo", "build", "--release"], cwd=CORPUS_RUST,
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "cargo build failed",
              file=sys.stderr)
        return
    rel = CORPUS_RUST / "target" / "release"
    fails = 0
    for src, meta in RUST_SOURCE_META.items():
        built = rel / src
        if not built.exists():
            print(f"FAIL {src}: not produced")
            fails += 1
            continue
        for stripped in (False, True):
            sym = "strip" if stripped else "sym"
            name = f"{src}__macho-arm64__rust__static__{sym}"
            shutil.copy2(built, BIN / name)
            if stripped:
                subprocess.run(["strip", "-x", str(BIN / name)], capture_output=True)
            print(f"OK {name}")
            rec = _record(name, src, "macho", "arm64", "rust", "0", "static", stripped)
            rec["present_asymmetric"] = meta["present"]
            rec["families"] = meta["families"]
            rec["source"] = f"{src}.rs"
            records.append(rec)
    print(f"Rust build failures: {fails}")


def _record(name, src, fmt, arch, compiler, opt, linkage, stripped) -> dict:
    meta = SOURCE_META.get(src, {"present": False, "families": []})
    return {
        "binary": name,
        "source": f"{src}.c",
        "present_asymmetric": meta["present"],
        "families": meta["families"],
        "format": fmt,
        "arch": arch,
        "compiler": compiler,
        "opt": f"O{opt}",
        "linkage": linkage,
        "stripped": stripped,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--elf-only", action="store_true")
    ap.add_argument("--macho-only", action="store_true")
    ap.add_argument("--go-only", action="store_true")
    ap.add_argument("--pe-only", action="store_true")
    ap.add_argument("--rust-only", action="store_true")
    ap.add_argument("--clean", action="store_true", help="wipe bin/ first")
    args = ap.parse_args()

    if args.clean and BIN.exists():
        shutil.rmtree(BIN)
    BIN.mkdir(exist_ok=True)

    records: list[dict] = []
    only = (args.elf_only or args.macho_only or args.go_only or args.pe_only
            or args.rust_only)
    if args.elf_only or not only:
        build_elf(records)
    if args.macho_only or not only:
        build_macho(records)
    if args.go_only or not only:
        build_go(records)
    if args.pe_only or not only:
        build_pe(records)
    if args.rust_only or not only:
        build_rust(records)

    records.sort(key=lambda r: r["binary"])
    GROUND_TRUTH.write_text(json.dumps(records, indent=2) + "\n")
    pos = sum(r["present_asymmetric"] for r in records)
    print(f"\n=== built {len(records)} binaries ({pos} positive / {len(records) - pos} control) ===")
    print(f"ground truth -> {GROUND_TRUTH.relative_to(HERE.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
