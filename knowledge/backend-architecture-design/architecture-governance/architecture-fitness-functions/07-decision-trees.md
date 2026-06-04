# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architecture Governance
**Knowledge Unit:** Architecture fitness functions via static analysis
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Which fitness functions to implement first
* Decision 2: PHPStan custom rules vs Deptrac vs PHPArkitect selection
* Decision 3: Fast (per-commit) vs thorough (nightly) CI pipeline separation

---

# Architecture-Level Decision Trees

---

## Decision: Which Fitness Functions to Implement First

---

## Decision Context

Determine the order of introducing architecture fitness functions, balancing value vs team disruption.

---

## Decision Criteria

* performance considerations: each rule adds CI time; start with fastest, most valuable checks
* architectural considerations: enforce most critical architectural rules first (dependency direction)
* security considerations: security-related rules (no raw SQL in domain) should be early
* maintainability considerations: too many rules too early causes rule fatigue and abandonment

---

## Decision Tree

Does the rule prevent the most common architectural violation in the codebase?
↓
YES → Implement first (highest value, most violations caught)
NO → Does the rule protect the most critical architectural principle?
    YES → Is the rule easy to understand and fix?
        YES → Implement early (easy wins build team confidence)
        NO → Postpone until team is familiar with the process
    NO → Does the rule enforce domain layer purity (no framework imports)?
        YES → Implement first or second (foundational rule)
        NO → Does the rule prevent circular dependencies?
            YES → Implement early (cycles are hard to break later)
            NO → Defer to later sprints

---

## Rationale

Start with 3-5 high-impact rules that are easy to understand and fix. "Domain must not depend on Infrastructure" and "No circular dependencies" are typical first candidates. Add rules incrementally as the team adapts to the process.

---

## Recommended Default

**Default:** Rule 1: Domain must not import Illuminate. Rule 2: No circular dependencies. Rule 3: Services must not call Eloquent directly.

**Reason:** These three rules protect the most critical architectural principles with clear, easy-to-fix violations. They catch the most common architectural drift patterns in Laravel projects.

---

## Risks Of Wrong Choice

Too many rules at once: developer frustration, all rules disabled within weeks. Wrong rules first: low-value alerts, team ignores fitness functions. Too few rules: architectural drift continues undetected in unprotected areas.

---

## Related Rules

- Rule 1: Enforce every critical architectural rule as an automated fitness function in CI
- Rule 2: Start with 3-5 high-value fitness functions before adding more

---

## Related Skills

- Implement Architecture Fitness Functions
- Perform Dependency Analysis
- Write an Architecture Decision Record

---

## Decision: PHPStan Custom Rules vs Deptrac vs PHPArkitect Selection

---

## Decision Context

Choose the appropriate tool for implementing each architecture fitness function.

---

## Decision Criteria

* performance considerations: PHPStan ~10-60s, Deptrac ~5-30s, PHPArkitect ~5-20s
* architectural considerations: PHPStan handles class-level rules; Deptrac handles module-level; PHPArkitect handles architecture-level assertions
* security considerations: all tools run at build time; no runtime impact
* maintainability considerations: PHPStan rules are code; Deptrac is YAML config; both need maintenance

---

## Decision Tree

Does the rule enforce a class-level constraint (e.g., "no Eloquent in Domain layer")?
↓
YES → PHPStan custom rule (best for import/dependency checks at class level)
NO → Does the rule enforce a module-level dependency constraint (e.g., "Billing must not depend on Notifications")?
    YES → Deptrac (designed for module-level dependency analysis)
    NO → Does the rule enforce an architecture-level assertion (e.g., "Controllers must only call Application services")?
        YES → PHPArkitect (dedicated architecture assertion DSL)
        NO → Is the rule a combination of multiple constraints?
            YES → PHPArkitect for complex assertions; PHPStan for simple import checks
            NO → Start with PHPStan; escalate to Deptrac if module-level analysis needed

---

## Rationale

Each tool has strengths: PHPStan for detailed import-level rules, Deptrac for module dependency graphs, PHPArkitect for expressive architecture assertions. Use the right tool for the right level of enforcement rather than forcing one tool to do everything.

---

## Recommended Default

**Default:** PHPStan custom rules for layer import enforcement; Deptrac for module dependency rules.

**Reason:** PHPStan is already in most Laravel projects. Deptrac provides superior module-level analysis. Together they cover most common architecture fitness function needs.

---

## Risks Of Wrong Choice

PHPStan for module-level rules: overly complex custom rules that duplicate Deptrac's built-in analysis. Deptrac for class-level rules: not designed for fine-grained import control. PHPArkitect for everything: team learning curve, potential over-engineering.

---

## Related Rules

- Rule 1: Enforce every critical architectural rule as an automated fitness function in CI
- Rule 4: Include positive guidance rules, not only negative constraints

---

## Related Skills

- Implement Architecture Fitness Functions
- Perform Dependency Analysis

---

## Decision: Fast (Per-Commit) vs Thorough (Nightly) CI Pipeline Separation

---

## Decision Context

Design the CI pipeline to balance fast feedback on common changes with thorough analysis that takes longer.

---

## Decision Criteria

* performance considerations: full analysis on every commit slows CI feedback
* architectural considerations: thorough analysis catches subtle violations
* security considerations: thorough analysis includes deeper security-related rules
* maintainability considerations: separation reduces developer frustration with slow CI

---

## Decision Tree

Does the fitness function run in under 30 seconds?
↓
YES → Run on every commit (fast feedback is best feedback)
NO → Does the fitness function detect critical violations (architecture-breaking)?
    YES → Can it be optimized to run faster?
        YES → Optimize and run on every commit
        NO → Run on every commit anyway (critical violations justify the wait)
    NO → Can the check be deferred without risk?
        YES → Nightly thorough analysis (catch subtle drift without blocking commits)
        NO → Run on every commit (design narrower, faster checks)

---

## Rationale

Fast-running checks (< 30s) should run on every commit for immediate feedback. Slower, thorough analyses (dependency cycle detection, full module metrics) can run nightly. Critical architecture-breaking rules should always run on every commit regardless of speed.

---

## Recommended Default

**Default:** PHPStan layer rules on every commit; Deptrac full module analysis nightly.

**Reason:** PHPStan rules are fast and catch the most common violations immediately. Deptrac analysis is slower but critical for module-level health; nightly cadence is sufficient for trend detection.

---

## Risks Of Wrong Choice

Full analysis on every commit: CI pipeline too slow, developer frustration, rules bypassed. Only nightly analysis: violations undetected for 24+ hours, accumulated architectural drift.

---

## Related Rules

- Rule 5: Run fitness functions in CI, not just locally or on-demand

---

## Related Skills

- Implement Architecture Fitness Functions
- Perform Dependency Analysis
