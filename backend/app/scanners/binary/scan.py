"""Binary-tier orchestrator: fuse Tier A (symbols) + Tier B (curve constants) into
a single quantum-posture finding for a compiled artifact, reported through the same
classify.py risk taxonomy as the network (black-box) scanner.

Decision fusion (grounded in what the benchmark measured):

  HIGH confidence  -> Tier A found imported QV APIs. Dynamic linkage; precise family;
                      survives stripping. This is the trustworthy path.

  LOW confidence   -> static-linkage presence signal only: Tier A saw QV machinery in
                      the (over-linked) symbol table, and/or Tier B saw standard-curve
                      constants. We can say "asymmetric crypto is linked in" but NOT
                      that the program calls it, nor (reliably) which primitive. Flag
                      for review; resolving it needs reachability (Tier C, not built).

  NONE             -> no asymmetric signal. NOTE the residual blind spot: a stripped,
                      statically-linked binary that embeds no standard-curve constant
                      (e.g. RSA-only) is indistinguishable from a clean control here.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

from ..blackbox.classify import classify_pubkey, est_time_to_break, hndl_risk
from . import tier_a_symbols, tier_b_constants, tier_c_reachability


@dataclass
class BinaryFinding:
    path: str
    fmt: str
    detected: bool                       # any asymmetric signal at all
    confidence: str                      # high | low | none
    families: list[str] = field(default_factory=list)
    risk_category: str = "unknown"       # shor_broken | grover_weakened | pqc | unknown
    detection_via: str = "none"          # symbol-import | static-presence | curve-constant | none
    time_to_break: str = ""
    hndl: str = "low"
    evidence: list[str] = field(default_factory=list)
    note: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


def scan_binary(path: str) -> BinaryFinding:
    a = tier_a_symbols.analyze(path)
    b = tier_b_constants.analyze(path)

    f = BinaryFinding(path=path, fmt=a.fmt, detected=False, confidence="none")

    # --- HIGH confidence: program imports a QV API ---------------------------
    if a.decision == "asymmetric":
        f.detected = True
        f.confidence = "high"
        f.families = a.families
        f.detection_via = "symbol-import"
        f.evidence = a.evidence
        f.note = "asymmetric API imported by the binary's own code"

    # --- HIGH confidence: Go std-lib crypto symbols (linker DCE => callable) --
    elif a.decision == "asymmetric_go":
        f.detected = True
        f.confidence = "high"
        f.families = a.families
        f.detection_via = a.via or "go-symbol"
        f.evidence = a.evidence
        f.note = a.note

    # --- static presence: try Tier C reachability to confirm or refute use ----
    elif a.decision == "inconclusive_static" or b.decision == "ecc_present":
        c = tier_c_reachability.analyze(path)

        if c.ran and c.reached_qv:
            # Proven: the program's own code reaches a QV API. Upgrade to HIGH and
            # take the precise, reachability-derived families (kills over-linking).
            f.detected = True
            f.confidence = "high"
            f.families = sorted(c.reachable_families)
            f.detection_via = "reachability"
            f.evidence = [f"reach:{c.root}->{fam}" for fam in f.families][:6]
            f.note = c.note

        elif c.ran and not c.reached_qv:
            # Asymmetric machinery is statically linked but no call path from the
            # entry reaches it -> treat as not used (removes static over-linking
            # false positives). Conservative: indirect dispatch is unresolved.
            f.detected = False
            f.confidence = "none"
            f.detection_via = "reachability-negative"
            f.note = c.note

        else:
            # Tier C could not run (stripped / no symbols): fall back to LOW-
            # confidence presence from Tier A symbols and/or Tier B constants.
            f.detected = True
            f.confidence = "low"
            vias, fams = [], set()
            if a.decision == "inconclusive_static":
                vias.append("static-presence")
                fams.update(a.families)
                f.evidence += a.evidence
            if b.decision == "ecc_present":
                vias.append("curve-constant")
                fams.add("ECC")
                f.evidence += b.evidence
            f.detection_via = "+".join(vias)
            f.families = sorted(fams)
            f.note = ("statically linked asymmetric crypto present; reachability "
                      "could not run (stripped/no symbols) so use is unverified.")

    # --- symmetric-only crypto consumer (true negative for asymmetric) -------
    elif a.decision == "symmetric_or_none":
        f.note = a.note

    # --- nothing visible -----------------------------------------------------
    else:
        f.note = ("no asymmetric crypto detected. Residual blind spot: a stripped, "
                  "statically-linked binary with no standard-curve constants cannot "
                  "be distinguished from a clean binary by Tier A/B.")

    # --- risk framing via the shared taxonomy --------------------------------
    if f.detected:
        # Map the first concrete family to a representative algorithm token for
        # classify_pubkey; all our families are Shor-broken.
        rep = (f.families or ["asymmetric"])[0]
        f.risk_category = classify_pubkey(rep) if f.families else "shor_broken"
        if f.risk_category == "unknown":
            f.risk_category = "shor_broken"
        f.time_to_break = est_time_to_break(rep, None)
        # Binaries embedding long-lived static keys have no forward secrecy by
        # default; treat unknown-FS asymmetric as medium HNDL.
        f.hndl = hndl_risk(f.risk_category, None)
    return f
