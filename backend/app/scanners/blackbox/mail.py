"""Black-box mail STARTTLS inspection. Find a domain's mail servers (MX records),
upgrade the SMTP connection to TLS via STARTTLS, and run the SAME cert analysis as
the web scanner. Email is highly sensitive and long-lived -> prime
harvest-now-decrypt-later target.
"""
from __future__ import annotations

import smtplib

import dns.resolver

from .tls import TlsCryptoFacts, error_facts, facts_from_ssl_sock, scan_context


def mx_hosts(domain: str, limit: int = 3) -> list[str]:
    try:
        ans = dns.resolver.resolve(domain, "MX", lifetime=8)
        ranked = sorted((r.preference, str(r.exchange).rstrip(".")) for r in ans)
        return [h for _, h in ranked][:limit]
    except Exception:
        return []


def scan_smtp_starttls(host: str, port: int = 25, timeout: int = 8) -> TlsCryptoFacts:
    try:
        smtp = smtplib.SMTP(host, port, timeout=timeout)
        try:
            smtp.ehlo()
            smtp.starttls(context=scan_context())
            return facts_from_ssl_sock(smtp.sock, host, port)
        finally:
            try:
                smtp.close()
            except Exception:
                pass
    except Exception as e:
        return error_facts(host, port, str(e))


def scan_mail(domain: str) -> list[TlsCryptoFacts]:
    """Scan a domain's MX mail servers via SMTP STARTTLS (port 25, then 587)."""
    out: list[TlsCryptoFacts] = []
    for host in (mx_hosts(domain) or [domain]):
        for port in (25, 587):
            facts = scan_smtp_starttls(host, port)
            if not facts.error:
                out.append(facts)
                break
    return out


if __name__ == "__main__":
    import json
    import sys

    dom = sys.argv[1] if len(sys.argv) > 1 else "gmail.com"
    print("MX:", mx_hosts(dom))
    for f in scan_mail(dom):
        print(json.dumps(f.to_dict()))
