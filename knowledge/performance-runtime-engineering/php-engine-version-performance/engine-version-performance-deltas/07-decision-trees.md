# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Engine Version Performance Deltas
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to upgrade PHP for performance vs security | Planning | Evaluate |
| 2 | Which version to target when upgrading | Version Selection | Migrate |
| 3 | Whether to benchmark before upgrade | Testing | Measure |

---

# Architecture-Level Decision Trees

---

## Decision: Upgrade for Performance vs Security

---

## Decision Context

Deciding whether the primary driver for a PHP version upgrade is performance gain or security compliance.

---

## Decision Criteria

* **performance** — 1-26% gain per version, diminishing after 8.3
* **architectural** — breaking changes may require code refactoring
* **security** — EOL versions have unpatched CVEs
* **maintainability** — each upgrade cycle costs engineering time

---

## Decision Tree

Is the current PHP version actively supported?
↓
**NO (EOL or security-only)** → Upgrade for security reasons immediately; performance is secondary
**YES (active support)** → Evaluate performance gain vs migration effort

---

What is the performance gain from the next version for your workload?
↓
**>10% improvement** → Upgrade justified on performance grounds
**3-10% improvement** → Beneficial if migration effort is low
**<3% improvement** → Upgrade only if new features or security patches are needed

---

Have you tuned OpCache and runtime architecture first?
↓
**NO** → Tune OpCache (2-4x) and evaluate runtime architecture (3-15x) before upgrading PHP version
**YES** → Version upgrade is the next lever

---

## Rationale

OpCache provides 2-4x gain with zero code changes. Runtime migration provides 3-15x for API workloads. A PHP version upgrade at 1-26% is the smallest lever and should be pulled last, except when security mandates it.

---

## Recommended Default

**Default:** Upgrade PHP version for security compliance first; performance gains are a bonus, not the primary driver.
**Reason:** Later versions offer diminishing returns; bigger levers (OpCache, runtime architecture) should be prioritized.

---

## Risks Of Wrong Choice

* Upgrading for performance without tuning OpCache first: missed 2-4x gain
* Not upgrading EOL version: unpatched vulnerabilities
* Sequential upgrades through every minor: wasted testing cycles

---

## Related Rules

* Prioritize OpCache and Runtime Over Version Upgrades
* Benchmark Before and After Each Version Upgrade
* Leapfrog Intermediate Versions

---

## Related Skills

* Measure and Validate PHP Engine Version Performance Deltas
