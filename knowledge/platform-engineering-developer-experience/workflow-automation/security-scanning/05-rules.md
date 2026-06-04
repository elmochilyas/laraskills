# Rules: Security Scanning

## Metadata
- **Source KU:** security-scanning
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SECSCAN-RULE-001: **Use Composer Audit in CI** — `composer audit` as fast built-in check (1-2s) for known vulnerabilities.
- SECSCAN-RULE-002: **Enable GitHub secret scanning push protection** — Prevents commits with known secret patterns.
- SECSCAN-RULE-003: **Use both Dependabot (proactive fix PRs) and Composer Audit (reactive CI gate).**
- SECSCAN-RULE-004: **Configure severity thresholds** — Block on High+ for standard projects; all severities for PCI/HIPAA.
- SECSCAN-RULE-005: **Always commit composer.lock** — Security scanners need exact versions to determine vulnerability status.
- SECSCAN-RULE-006: **Define vulnerability remediation SLAs** — Critical <24h, High <72h, Medium <2w, Low <1mo.

## Architecture Rules
- SECSCAN-RULE-007: **Composer audit as CI step** — Fails build if known vulnerabilities found.
- SECSCAN-RULE-008: **Dependabot security-only pattern** — Daily scanning with security label; limited PR count.
- SECSCAN-RULE-009: **Run fast scans (Composer audit) in main pipeline**; deep scans as scheduled workflows.

## Decision Rules
- SECSCAN-RULE-010: **Every Laravel project with external dependencies** needs vulnerability scanning.
- SECSCAN-RULE-011: **Skip for prototype projects** with no real data or users.
- SECSCAN-RULE-012: **Scan all dependencies including dev** — Vulnerabilities in dev tools can be exploited.
