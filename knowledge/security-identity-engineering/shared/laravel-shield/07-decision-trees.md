# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Laravel-Shield Security Scanning CLI
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Shield vs Enlightn Deployment | When to use each security scanner | coverage, speed |
| 2 | Shield Scan Scheduling | How often and when to run Shield scans | detection, automation |

---

# Architecture-Level Decision Trees

---

## Shield vs Enlightn Deployment

---

## Decision Context

Choosing between Laravel-Shield (fast, ~20 checks) and Enlightn (comprehensive, 120+ checks) — and whether to use both.

---

## Decision Criteria

* coverage
* speed

---

## Decision Tree

What is the scan's purpose?
↓
Quick pre-deployment check (<10 seconds) → Shield (catches the 20 most dangerous misconfigurations)
Comprehensive CI audit → Enlightn (covers authentication, CSRF, sessions, headers, more)

Is this a CI gate for every commit?
↓
YES → Run both: Shield first (fast fail), then Enlightn (deep analysis)
NO → Run Enlightn at minimum; add Shield as a pre-commit hook for instant feedback

Is there already a comprehensive security scanning tool?
↓
YES → Shield complements as a fast pre-deploy check (catch debug mode, exposed .env instantly)
NO → Both recommended: Shield for quick wins, Enlightn for full coverage

What is the team's security maturity?
↓
Low → Start with Shield (easy to adopt, fast results, fixes most dangerous issues)
Medium → Add Enlightn for comprehensive CI coverage
High → Both configured with appropriate thresholds, plus custom checks

Is the tool used in pre-deployment hooks?
↓
YES → Shield (must be fast — deployments cannot wait 30+ seconds for Enlightn)
NO → Enlightn in CI (slower but comprehensive)

---

## Rationale

Shield and Enlightn serve different purposes at different stages. Shield is a fast safety net for the most dangerous misconfigurations — it should run in pre-deployment hooks and as a pre-commit check. Enlightn is a comprehensive audit that runs in CI, covering 100+ additional checks. They are complementary, not interchangeable. Shield answers "is the app on fire right now?" while Enlightn answers "what else needs to be fixed?"

---

## Recommended Default

**Default:** Both Shield and Enlightn; Shield in pre-deployment hook and as pre-commit check; Enlightn in CI pipeline with score 90+ gate; Shield weekly cron for configuration drift detection
**Reason:** Shield catches the most dangerous issues in under 10 seconds — perfect for pre-deployment hooks where speed is critical. Enlightn provides comprehensive coverage in CI where the extra 30 seconds is acceptable. Together they provide layered security scanning at every stage of the pipeline.

---

## Risks Of Wrong Choice

- Shield only: misses CSRF, session, CORS, rate limiting, and 100+ other checks
- Enlightn only: no fast pre-deployment check — deployment proceeds even with exposed .env or debug mode
- Neither: no automated security scanning at all — configuration drift goes undetected
- Shield in CI only, not pre-deploy: deployment script proceeds before Shield can catch issues

---

## Related Rules

- Always Run Laravel-Shield as a Pre-Deployment Gate (05-rules.md)
- Complement Shield with Enlightn for Comprehensive Coverage (05-rules.md)
- Schedule Periodic Shield Scans (05-rules.md)

---

## Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)

---

## Shield Scan Scheduling

---

## Decision Context

How often and at what stages to schedule Shield scans for maximum security coverage.

---

## Decision Criteria

* detection
* automation

---

## Decision Tree

At what stages is the application available?
↓
Local dev → Run Shield as pre-commit hook (git hook catches issues before push)
CI → Run Shield on every pull request (catches configuration drift introduced in PR)
Pre-deployment → Run Shield in deploy script (abort on critical issues)
Production → Run Shield weekly (catches configuration drift from manual server changes)

Are there manual server configuration changes?
↓
YES → Weekly Shield scans critical (someone may enable debug mode on server directly)
NO → CI and pre-deployment scans may be sufficient

Is the application Docker-based?
↓
YES → Add Docker image scanning (Shield does not scan container images)
NO → Shield's file-system analysis covers the deployment directly

What is the team's alert fatigue tolerance?
↓
Low → Shield weekly scan with email only on critical findings
High → Shield daily scan with report to team chat

---

## Rationale

Shield scans are fast enough (<10 seconds) to run at every stage of the pipeline with negligible overhead. The most important scan is the pre-deployment hook — it catches dangerous misconfigurations before they reach production. The weekly scan catches configuration drift that happens outside the deployment pipeline (direct server changes, emergency patches, infrastructure changes).

---

## Recommended Default

**Default:** Pre-commit git hook (Shield); CI pipeline on every PR; pre-deployment script (abort on critical); weekly production cron with email report on critical findings only
**Reason:** The most dangerous time for misconfigurations is during and between deployments. Pre-commit catches developer mistakes before they reach the repo. CI catches PR issues. Pre-deployment catches any remaining issues before they affect users. Weekly scans catch configuration drift from non-deployment changes (server admin modifications, infrastructure changes).

---

## Risks Of Wrong Choice

- No pre-deployment scan: debug mode or exposed .env reaches production
- No weekly scan: manual server change enables debug mode, remains undetected for weeks
- Only initial scan: new issues introduced after the first scan never caught
- Daily scans with all findings reported: team ignores alerts due to over-notification

---

## Related Rules

- Always Run Laravel-Shield as a Pre-Deployment Gate (05-rules.md)
- Schedule Periodic Shield Scans (05-rules.md)
- Complement Shield with Enlightn for Comprehensive Coverage (05-rules.md)

---

## Related Skills

- Quick-Scan Laravel Security with Laravel-Shield CLI (06-skills.md)
