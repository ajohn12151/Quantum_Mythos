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

import subprocess
import tarfile
import tempfile
from pathlib import Path

from .artifact import ArtifactScan, is_binary_magic
from .scan import scan_binary

_MAX_MEMBER_BYTES = 512 * 1024 * 1024
_SKIP_SUFFIXES = {".txt", ".md", ".json", ".yaml", ".yml", ".conf", ".html", ".css",
                  ".png", ".jpg", ".svg", ".pdf", ".log", ".sh", ".pem", ".crt"}


class ImageError(RuntimeError):
    pass


def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def scan_image(ref: str) -> ArtifactScan:
    """Flatten a container image and scan every binary in its root filesystem."""
    if _run(["docker", "version", "--format", "{{.Server.Version}}"]).returncode != 0:
        raise ImageError("docker is not available / daemon not responding")

    create = _run(["docker", "create", ref])
    if create.returncode != 0:
        raise ImageError(f"docker create {ref!r} failed: {create.stderr.strip()}")
    container_id = create.stdout.strip()

    findings = []
    try:
        proc = subprocess.Popen(["docker", "export", container_id],
                                stdout=subprocess.PIPE)
        with tarfile.open(fileobj=proc.stdout, mode="r|*") as tar:
            for member in tar:
                if not member.isfile() or member.size == 0 or member.size > _MAX_MEMBER_BYTES:
                    continue
                if Path(member.name).suffix.lower() in _SKIP_SUFFIXES:
                    continue
                fh = tar.extractfile(member)
                if fh is None:
                    continue
                head = fh.read(4)
                if not is_binary_magic(head):
                    continue
                # Materialize just this binary to a temp file and scan it.
                with tempfile.NamedTemporaryFile(suffix=".bin") as tmp:
                    tmp.write(head)
                    while True:
                        chunk = fh.read(1 << 20)
                        if not chunk:
                            break
                        tmp.write(chunk)
                    tmp.flush()
                    f = scan_binary(tmp.name)
                f.path = "/" + member.name        # report the in-image path
                findings.append(f)
        proc.stdout.close()
        proc.wait()
    finally:
        _run(["docker", "rm", "-f", container_id])

    return ArtifactScan(target=f"image:{ref}", findings=findings)
