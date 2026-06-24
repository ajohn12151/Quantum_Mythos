"""Binary tier — detect quantum-vulnerable asymmetric crypto in compiled binaries.

Public entry point: scan_binary(path) -> BinaryFinding.
"""
from .scan import BinaryFinding, scan_binary

__all__ = ["scan_binary", "BinaryFinding"]
