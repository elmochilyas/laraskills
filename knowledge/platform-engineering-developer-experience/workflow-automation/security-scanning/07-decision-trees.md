# 07-Decision Trees: Security Scanning

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | security-scanning |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Scanning Scope | Which security scans to run in CI | What types of security vulnerabilities should we automatically detect? |
| D02 | Severity Threshold | Which severity levels block CI | How strict should the security gate be before blocking a merge? |
| D03 | Secret Detection | How to prevent credential leaks | How do we catch accidentally committed secrets before they reach the repository? |
| D04 | Remediation SLA | How quickly vulnerabilities must be fixed | What is the acceptable timeline for fixing each severity level? |

## Architecture-Level Decision Trees

### D01: Scanning Scope

```
START: Which security scans should we implement?
│
├── Dependency vulnerability scanning (essential)
│   ├── Tool: Composer Audit (composer audit)
│   ├── Coverage: checks all Composer dependencies
│   ├── Speed: 1-2 seconds — negligible CI overhead
│   ├── Database: GitHub Advisory Database
│   └── Action: fail CI if vulnerabilities found
│
├── Secret scanning (essential)
│   ├── Tool: GitHub secret scanning (auto-enabled)
│   ├── Push protection: prevents commits with secrets
│   ├── Coverage: checks all files for secret patterns
│   └── Action: block push if secret detected
│
├── NPM audit (if using npm packages)
│   ├── Command: npm audit --audit-level=high
│   ├── Coverage: NPM dependencies
│   └── Action: warn or fail based on severity
│
├── SAST scanning (recommended for high-risk)
│   ├── Tool: TruffleHog, Gitleaks, or custom SAST
│   ├── Coverage: source code for security anti-patterns
│   ├── Speed: 2-20 minutes (schedule separately)
│   └── Action: report findings, triage manually
│
└── Scanning frequency
    ├── Fast scans (Composer Audit, Secret Scan): every push
    ├── Deep scans (SAST): nightly or weekly schedule
    └── Dependency updates (Dependabot): continuous monitoring
```

### D02: Severity Threshold

```
START: Which vulnerability severity should block CI?
│
├── Block on Critical + High (recommended)
│   ├── Critical: CI fails, PR blocked
│   ├── High: CI fails, PR blocked
│   ├── Medium: CI warns, doesn't block
│   ├── Low: CI informs, doesn't block
│   └── Rationale: balances security with development velocity
│
├── Block on all severities (strict — PCI/HIPAA)
│   ├── Every known vulnerability blocks merge
│   ├── Even Low severity must be addressed
│   ├── High overhead: many transient warnings
│   └── Best for: compliance-regulated projects
│
├── Warn only (permissive)
│   ├── No severity blocks CI
│   ├── Warnings: visible in CI output but don't fail
│   ├── Manual: rely on developers to address
│   └── Risk: warnings are often ignored
│
└── Threshold customization
    ├── Per environment: staging can be stricter than prod
    ├── Per project type: payments app stricter than internal tool
    └── Review: adjust threshold quarterly based on false positive rate
```

### D03: Secret Detection

```
START: How do we prevent credential leaks?
│
├── GitHub secret scanning push protection (essential)
│   ├── Auto-enabled: for public repos
│   ├── Manual enable: for private repos (Settings → Security)
│   ├── Coverage: checks every push for known secret patterns
│   ├── Action: blocks push with secrets detected
│   └── Example patterns: AWS keys, GitHub tokens, database URLs
│
├── Pre-commit secret scanning
│   ├── Tool: CaptainHook + TruffleHog or Gitleaks
│   ├── Coverage: staged files before commit
│   ├── Action: blocks commit if secrets detected
│   └── Benefit: prevents secrets from ever entering git history
│
├── Full git history scan (one-time cleanup)
│   ├── When: retroactively scanning for committed secrets
│   ├── Tool: git leak, trufflehog (scan full history)
│   ├── Action: identify exposed secrets → rotate → scrub from history
│   └── Required after: discovering a past credential leak
│
└── .env.example hygiene
    ├── Use: placeholder values, not real-looking secrets
    ├── Check: .env files in .gitignore are enforced
    └── Scan: CI checks that no .env files are committed
```

### D04: Remediation SLA

```
START: How quickly must vulnerabilities be fixed?
│
├── Critical (CVSS 9.0-10.0)
│   ├── SLA: <24 hours
│   ├── Action: immediate fix, hotfix process
│   ├── Escalate: if can't fix in 24h, implement mitigation
│   ├── Notification: team + security lead
│   └── Example: remote code execution vulnerability
│
├── High (CVSS 7.0-8.9)
│   ├── SLA: <72 hours
│   ├── Action: schedule fix in current sprint
│   ├── Notification: security lead
│   └── Example: SQL injection, authentication bypass
│
├── Medium (CVSS 4.0-6.9)
│   ├── SLA: <2 weeks
│   ├── Action: add to next sprint backlog
│   └── Example: XSS in admin panel (non-public)
│
├── Low (CVSS 0.1-3.9)
│   ├── SLA: <1 month
│   ├── Action: add to backlog, fix in maintenance window
│   └── Example: informational disclosure
│
└── SLA management
    ├── Track: vulnerability age from detection
    ├── Alert: if approaching SLA deadline
    ├── Report: monthly security dashboard to team
    └── Escalate: to management if consistently missing SLAs
```
