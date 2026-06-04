# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** PHP Version Numbering
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which PHP version to run in production | Version Selection | Plan |
| 2 | When to upgrade PHP version | Timing | Maintain |
| 3 | Leapfrog vs sequential upgrade | Strategy | Plan |
| 4 | Hold current version vs upgrade | Risk Assessment | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Which PHP Version to Run in Production

---

## Decision Context

Choosing a PHP version for production deployment — balancing security support, performance, and compatibility.

---

## Decision Criteria

* **performance** — newer versions provide 1-26% throughput gains
* **architectural** — extension and package compatibility constraints
* **security** — EOL versions have unpatched CVEs
* **maintainability** — support timeline and migration planning

---

## Decision Tree

What is the support status of the current PHP version?
↓
**EOL (no security patches)** → Upgrade immediately — highest priority
**Security-only support** → Plan upgrade within 90 days
**Active support** → Evaluate next planned upgrade window

---

Is this a new project or existing deployment?
↓
**New project** → Use latest stable version (8.5 as of 2026)
**Existing deployment** → Proceed to support status check above

---

Does the target version have extension compatibility confirmed?
↓
**YES** → Proceed with upgrade plan
**NO** → Wait for extension support or find alternatives

---

## Rationale

Running EOL versions exposes unpatched security vulnerabilities and violates compliance. New projects should start on the latest stable version to maximize support lifetime. Extension compatibility is the most common blocker.

---

## Recommended Default

**Default:** PHP 8.5 (latest active support) for new projects; migrate existing EOL versions immediately.
**Reason:** Maximizes security support window and provides latest performance improvements.

---

## Risks Of Wrong Choice

* Running EOL PHP: unpatched CVEs, compliance failures, forced emergency upgrades
* Chasing .0 releases: undiscovered bugs in x.y.0 releases
* Upgrading too frequently: wasted testing cycles for marginal gains

---

## Related Rules

* Upgrade Before EOL
* Leapfrog Minor Versions
* Validate Extension Compatibility Before Upgrade

---

## Related Skills

* Plan a PHP Version Upgrade Based on Version Numbering Semantics

---

---

## Decision: Leapfrog vs Sequential Version Upgrade

---

## Decision Context

Choosing between upgrading through every intermediate version or skipping directly to the target version.

---

## Decision Criteria

* **performance** — cumulative gains from skipped versions may be missed if bottlenecks are present
* **architectural** — breaking changes accumulate across skipped versions
* **maintainability** — fewer migration cycles saves engineering effort

---

## Decision Tree

What versions are you migrating between?
↓
**7.4 to 8.x (major jump)** → Leapfrog to 8.2+ directly; test major BC breaks once
**8.1 to 8.4 (minor jump)** → Leapfrog to 8.4; each intermediate test cycle is wasteful
**8.4 to 8.5 (single minor)** → Upgrade directly; minimal breaking changes expected

---

Does the team have a comprehensive test suite?
↓
**YES** → Leapfrog is safe; run full suite after upgrade
**NO** → Sequential may be safer; one BC break at a time

---

Is there a specific feature in an intermediate version needed immediately?
↓
**YES** → Upgrade to that version first, then plan next leapfrog
**NO** → Leapfrog to the latest target version

---

## Rationale

Leapfrog reduces migration cycles from N to 1, saving significant engineering effort. Each intermediate version requires a full test cycle. The performance gain between 8.2→8.5 is <5%, not worth three separate migrations.

---

## Recommended Default

**Default:** Leapfrog intermediate versions (e.g., 7.4 directly to 8.2+).
**Reason:** Minimizes migration cycles while capturing cumulative benefit.

---

## Risks Of Wrong Choice

* Sequential: 3x more testing cycles, delayed migration to supported versions
* Leapfrog without test suite: undetected BC breaks from multiple versions of changes

---

## Related Rules

* Leapfrog Minor Versions
* Validate Extension Compatibility Before Upgrade

---

## Related Skills

* Plan a PHP Version Upgrade Based on Version Numbering Semantics
