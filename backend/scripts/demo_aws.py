"""AWS demo preset — scan the AWS services this hackathon runs on and show their
quantum exposure. Reproducible, fast, deterministic (direct endpoint scan, no
discovery/rate-limit dependency).

Run from backend/:  ./.venv/bin/python scripts/demo_aws.py
"""
from app.scanners.blackbox.tls import scan_tls

# Curated AWS service endpoints, ordered for narrative impact.
TARGETS = [
    ("signin.aws.amazon.com", "AWS sign-in (authentication)"),
    ("console.aws.amazon.com", "AWS Management Console"),
    ("iam.amazonaws.com", "IAM — identity & access"),
    ("sts.amazonaws.com", "STS — security tokens"),
    ("s3.amazonaws.com", "S3 — object storage"),
    ("dynamodb.us-east-1.amazonaws.com", "DynamoDB (a required DB for this hackathon)"),
    ("ec2.amazonaws.com", "EC2 — compute"),
    ("lambda.us-east-1.amazonaws.com", "Lambda — serverless"),
]

BANNER = "=" * 78


def main() -> None:
    print(BANNER)
    print("QUANTUM MYTHOS — AWS quantum-exposure scan (black-box, zero access)")
    print(BANNER)
    print(f"{'AWS service':<34} {'pubkey':<9} {'bits':<5} {'verdict'}")
    print("-" * 78)

    shor = 0
    for host, label in TARGETS:
        f = scan_tls(host)
        if f.error:
            print(f"{host:<34} (unreachable: {f.error[:24]})")
            continue
        verdict = "SHOR-BREAKABLE" if f.category == "shor_broken" else f.category
        if f.category == "shor_broken":
            shor += 1
        print(f"{host:<34} {str(f.pubkey_algo):<9} {str(f.key_bits):<5} {verdict}")
        print(f"  └─ {label}")

    print("-" * 78)
    print(f"{shor}/{len(TARGETS)} core AWS endpoints authenticate with Shor-breakable RSA.\n")
    print("TALKING POINTS")
    print("  • The cert that proves 'this is really AWS' is RSA-2048 — Shor-breakable.")
    print("    A quantum computer forges it; harvest-now-decrypt-later starts today.")
    print("  • Found in seconds, from the outside, with ZERO access or credentials.")
    print("  • Frame respectfully: AWS is a PQC leader (s2n-tls, KMS hybrid). Even the")
    print("    most advanced security org still serves RSA on its front door — because")
    print("    the migration is industry-wide and just beginning. THAT is the market.")
    print(BANNER)


if __name__ == "__main__":
    main()
