"""Scan a container image for quantum-vulnerable crypto.

Containers are how most software actually ships, so this is the high-value front
door for the binary tier. We flatten the image with `docker create` + `docker
export` (Docker applies the layer whiteouts, so we get the final root filesystem as
one tar) and stream that tar, scanning only the members that look like binaries —
each candidate is written to a temp file, scanned, and deleted. Nothing is unpacked
to disk wholesale, so it scales to multi-GB images.

Requires a working Docker CLI. `docker create` pulls the image if it is not already
present locally.
"""
from __future__ import annotations

import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path

from .artifact import ArtifactScan, is_binary_magic
from .sandbox import scan_isolated
from .scan import scan_binary

_MAX_MEMBER_BYTES = 512 * 1024 * 1024
_MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024   # cap total extracted binary bytes per image
_SKIP_SUFFIXES = {".txt", ".md", ".json", ".yaml", ".yml", ".conf", ".html", ".css",
                  ".png", ".jpg", ".svg", ".pdf", ".log", ".sh", ".pem", ".crt"}


class ImageError(RuntimeError):
    pass


def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def scan_image(ref: str, *, sandbox: bool = True, timeout_s: int = 30) -> ArtifactScan:
    """Flatten a container image and scan every binary in its root filesystem.

    Streams the flattened tar and extracts only the binary members (bounded by a
    total-bytes budget) into a temp dir, then scans them in isolated, resource-capped
    workers — image content is untrusted, so sandbox=True is the default.
    """
    if _run(["docker", "version", "--format", "{{.Server.Version}}"]).returncode != 0:
        raise ImageError("docker is not available / daemon not responding")

    create = _run(["docker", "create", ref])
    if create.returncode != 0:
        raise ImageError(f"docker create {ref!r} failed: {create.stderr.strip()}")
    container_id = create.stdout.strip()

    tmpdir = tempfile.mkdtemp(prefix="qm_image_")
    extracted: list[tuple[str, str]] = []   # (temp_path, in_image_path)
    total = 0
    try:
        proc = subprocess.Popen(["docker", "export", container_id], stdout=subprocess.PIPE)
        with tarfile.open(fileobj=proc.stdout, mode="r|*") as tar:
            for i, member in enumerate(tar):
                if not member.isfile() or member.size == 0 or member.size > _MAX_MEMBER_BYTES:
                    continue
                if Path(member.name).suffix.lower() in _SKIP_SUFFIXES:
                    continue
                if total + member.size > _MAX_TOTAL_BYTES:
                    break                      # extraction budget exhausted
                fh = tar.extractfile(member)
                if fh is None:
                    continue
                head = fh.read(4)
                if not is_binary_magic(head):
                    continue
                dest = Path(tmpdir) / f"bin_{i}"
                with open(dest, "wb") as out:
                    out.write(head)
                    while True:
                        chunk = fh.read(1 << 20)
                        if not chunk:
                            break
                        out.write(chunk)
                total += member.size
                extracted.append((str(dest), "/" + member.name))
        proc.stdout.close()
        proc.wait()

        temp_paths = [t for t, _ in extracted]
        if sandbox:
            findings = scan_isolated(temp_paths, timeout_s=timeout_s)
        else:
            findings = [scan_binary(t) for t in temp_paths]
        for f, (_temp, in_image) in zip(findings, extracted):
            f.path = in_image                  # report the in-image path, not the temp file
    finally:
        _run(["docker", "rm", "-f", container_id])
        shutil.rmtree(tmpdir, ignore_errors=True)

    return ArtifactScan(target=f"image:{ref}", findings=findings)
