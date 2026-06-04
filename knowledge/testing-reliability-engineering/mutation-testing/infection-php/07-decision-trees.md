# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Mutation Testing
**Knowledge Unit:** Infection PHP Mutation Testing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Differential vs full mutation execution
2. MSI target setting strategy
3. Infection vs Pest mutation testing
4. Baseline management for equivalent survivors

---

# Architecture-Level Decision Trees

---

## Decision Name: Differential vs Full Mutation Execution

---

## Decision Context

Choose between differential mutation (per-PR) and full mutation (comprehensive) execution mode.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need per-PR CI feedback on new/changed code?
↓
YES → Use differential mutation: `--git-diff-filter=AM` (1-5 min)
NO → Need comprehensive pre-release quality assessment?
↓
YES → Use full mutation run (10-60 min) — schedule nightly or pre-release

↓
CI resources limited?
→ Differential mutation (fast, focused on changed lines)
CI resources available?
→ Both: differential on PRs, full mutation on merge/nightly

---

## Rationale

Full mutation takes 10-60 minutes, too slow for per-PR feedback. Differential mutation only mutates lines changed in the PR, completing in 1-5 minutes. Both are needed for different purposes.

---

## Recommended Default

**Default:** Differential on every PR; full mutation nightly/pre-release
**Reason:** Fast PR feedback with comprehensive coverage before releases.

---

## Risks Of Wrong Choice

Full mutation on every commit adds 30-min CI delay. Differential-only misses regressions in unchanged code.

---

## Related Rules

Rule 1: Use differential mutation for CI gates, full mutation for nightly

---

## Related Skills

Run Mutation Tests with Infection PHP

---

## Decision Name: MSI Target Setting Strategy

---

## Decision Context

Choose appropriate MSI (Mutation Score Indicator) targets for different code modules.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Code is critical path (auth, billing, security)?
↓
YES → Target 80-90% MSI (high coverage = high confidence)
NO → Code is utility/infrastructure module?
↓
YES → Target 50-60% MSI (acceptable risk for stable code)
NO → Standard business logic?
↓
Target 60-70% MSI (balanced)

What's current MSI?
→ Below 50%? Fix coverage first before setting MSI gate
→ 50-70%? Set achievable target at current + 10%
→ Above 70%? Set target at current + 5-10%, gradually increase

---

## Rationale

All code is not equally important. A surviving mutation in the auth module is a security risk. A surviving mutation in a utility helper may be acceptable.

---

## Recommended Default

**Default:** Overall MSI 60-70%, Covered MSI 70-80%, Critical paths 80%+
**Reason:** Achievable targets that prevent regression while allowing gradual improvement.

---

## Risks Of Wrong Choice

Setting 100% MSI is impossible; team ignores MSI. Setting too low misses important test gaps.

---

## Related Rules

Rule 3: Set achievable MSI targets — start at 60-70%
Rule 5: Set per-module MSI targets

---

## Related Skills

Run Mutation Tests with Infection PHP

---

## Decision Name: Infection vs Pest Mutation Testing

---

## Decision Context

Choose between standalone Infection PHP and Pest's built-in mutation testing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need comprehensive CI analysis (custom mutators, differential, MSI thresholds)?
↓
YES → Use Infection PHP (more features, deeper configuration)
NO → Need quick local feedback during development?
↓
YES → Use Pest's built-in `--mutate` flag (fast, convenient)
NO → Use Pest mutation for local; Infection for CI

---

## Rationale

Pest mutation is built on Infection's engine but provides a subset of features. Pest is convenient for local use; Infection provides differential mutation, custom mutators, and baseline support needed for CI.

---

## Recommended Default

**Default:** Pest mutation for local development; Infection for CI pipeline
**Reason:** Best of both — fast local feedback with comprehensive CI analysis.

---

## Risks Of Wrong Choice

Pest-only misses differential mutation and baseline features. Infection-only is too heavy for quick local checks.

---

## Related Rules

Rule 1: Use differential mutation for CI gates, full mutation for nightly

---

## Related Skills

Run Mutation Tests with Infection PHP
