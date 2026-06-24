# Linux build environment for the binary-tier benchmark.
# Produces real x86-64 ELF binaries linked against OpenSSL, in the full
# variant matrix (gcc/clang x O0/O3 x dynamic/static x symbols/stripped).
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        clang \
        libssl-dev \
        binutils \
        file \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work
