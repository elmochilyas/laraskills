# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Documentation CI Validation
**Generated:** 2026-06-03

---

# Decision Inventory

* Validation pipeline speed (fast lint vs comprehensive contract tests)
* Breaking change detection timing (PR vs deployment)

---

# Architecture-Level Decision Trees

---

## Validation Pipeline Speed — Fast Lint vs Comprehensive Contract Tests

---

## Decision Context

How comprehensive should CI validation be on every PR vs nightly? Arises when configuring documentation validation in CI.

---

## Decision Criteria

* developer velocity — fast feedback on PRs vs blocked by slow checks
* coverage — contract tests catch real bugs but take longer
* breaking changes — lint catches syntax; contracts catch semantic drift
* staleness — how often docs are updated

---

## Decision Tree

Is this a PR commit or a nightly/main branch validation?
↓
PR → Fast checks only:
    → Spec lint (syntax, structure)
    → Completeness check (all endpoints documented)
    → Breaking change diff against last release
Nightly/main → Full validation:
    → Contract tests against running API
    → Changelog presence verification
    → Full spec diff

---

## Recommended Default

**Default:** Fast lint + breaking diff on PRs; full contract tests nightly
**Reason:** Developers get immediate feedback without long waits; comprehensive validation still runs regularly.

---

## Risks Of Wrong Choice

Full validation on every PR: developers bypass or disable checks. Only lint on PRs: contract drift undetected until consumers report issues.

---

## Breaking Change Detection Timing — PR vs Deployment

---

## Decision Context

When should breaking changes in the spec be detected and reported? Arises when planning API evolution validation.

---

## Decision Tree

Does the PR modify existing API endpoints or schemas?
↓
YES → Detect breaking changes at PR time (compare against latest released spec)
    → Block PR if breaking change without version bump
NO → New endpoints only → No breaking change check needed

---

## Recommended Default

**Default:** Detect breaking changes at PR time, block without version bump
**Reason:** Prevents accidental breaking changes from reaching consumers.

---

## Risks Of Wrong Choice

Deployment-only detection: breaking changes released before anyone notices. No detection at all: consumers discover breaks at runtime.

---

*Related rules and skills are not available for this KU (no 05-rules.md or 06-skills.md files).*
