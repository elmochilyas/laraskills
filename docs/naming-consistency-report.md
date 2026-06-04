# Naming Consistency Report

**Date:** 2026-06-04

---

## 1. Directory Pluralization Inconsistency

| Path | Style | Notes |
|------|-------|-------|
| `agent/` | Singular | Contains 5 routing files |
| `agents/` | Plural | Contains 12 agent files |
| `skills/` | Plural | 12 skill directories |
| `rules/` | Plural | 4 rule categories |
| `knowledge/` | Singular (mass noun) | 21 domain directories |
| `intelligence/` | Singular (mass noun) | 3 subdirectories |

**Issue:** `agent/` (singular) and `agents/` (plural) coexist with different purposes. `agent/` is navigation/routing; `agents/` is agent definitions. This is intentional but potentially confusing.

**Recommendation:** Rename `agent/` to `routing/` or keep with documentation clarifying the distinction.

---

## 2. Subdomain Numbering Inconsistency

| Naming Style | Domains Using It |
|-------------|-----------------|
| `01-*`, `02-*` prefixed | ai-intelligence-systems, api-integration-engineering, cost-resource-optimization, data-engineering-analytics, devops-infrastructure, observability-production-intelligence, performance-runtime-engineering, platform-engineering-developer-experience, real-time-systems, search-retrieval-systems, testing-reliability-engineering |
| Descriptive-only | api-crud-system-engineering, application-architecture-patterns, async-distributed-systems, backend-architecture-design, data-storage-systems, governance-compliance-engineering, laravel-core-application-engineering, laravel-eloquent-domain-modeling, laravel-execution-lifecycle, security-identity-engineering |

**Issue:** 11 domains use numbered prefixes (`01-`, `02-`, etc.), 10 use descriptive-only names. The numbering scheme is inconsistent between domains (some skip numbers, use `S01-` or `Z0-` prefixes).

**Recommendation:** Standardize to either all-numbered or all-descriptive. Prefer descriptive-only for stability (renumbering doesn't break links).

---

## 3. Numeric-Only Knowledge Unit Names (58 KUs)

Several subdomains use purely numeric directory names (`01`, `02`, etc.) instead of descriptive slugs:

| Domain | Subdomain | Numeric KUs |
|--------|-----------|-------------|
| ai-intelligence-systems | agentic-workflows | 01–06 |
| ai-intelligence-systems | ai-gateway-routing | 01–04 |
| ai-intelligence-systems | decision-engine | 01–11 |
| api-crud-system-engineering | input-validation-architecture | 01–09 |

**Recommendation:** Rename to descriptive slugs (e.g., `01` → `agent-architecture-fundamentals`).

---

## 4. Special Prefix Inconsistency

| Domain | Prefix Pattern | Example |
|--------|---------------|---------|
| performance-runtime-engineering | `S01-`, `S02-`, `Z0-`, `Z9-` | `S01-php-engine-version-performance` |
| All others | `01-` or descriptive | `01-provider-integration` |

**Issue:** `performance-runtime-engineering` uses `S` and `Z` prefixes that are unexplained.

**Recommendation:** Document the prefix meaning or standardize.

---

## 5. Abbreviations Without Definitions

| Abbreviation | Location | Meaning |
|--------------|----------|---------|
| ECC | Repository-wide | Elite Coding Companion (assumed, not documented) |
| KU | AGENTS.md, indexes | Knowledge Unit |
| DTO, VO | Various | Data Transfer Object, Value Object |
| S* | performance-runtime-engineering | Unknown |

---

## 6. Misspelled Directory

| Path | Issue |
|------|-------|
| `devops-infrastructure/docker-containerization/docketfile-optimization/` | `docketfile` → should be `dockerfile` |

---

## Normalization Plan (Recommended)

| Priority | Change | Effort | Risk |
|----------|--------|--------|------|
| 1 | Fix `docketfile-optimization` misspelling | Low | Low |
| 2 | Rename 58 numeric-only KUs to descriptive slugs | Medium | Medium |
| 3 | Add abbreviation glossary to AGENTS.md | Low | Low |
| 4 | Standardize subdomain numbering or remove prefixes | High | High |
| 5 | Rename `agent/` to clarify purpose | Medium | Medium |
