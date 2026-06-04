# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: CI enforcement of architecture rules
Knowledge Unit ID: AEG-02
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

CI enforcement runs architecture tests, static analysis, and linters on every push. Rules are checked before a PR is merged. If a rule is violated, CI fails and the PR is blocked. The goal is to make architecture violations visible immediately, not during a quarterly review. CI enforcement also monitors trends: number of violations over time, test coverage for architecture rules, and drift metrics.

---

# Core Concepts

- **Pre-merge gate:** Architecture tests run in CI and must pass before a PR merges. No manual override. Violations must be fixed (or the rule must be changed).
- **Fail fast:** Architecture tests run early in the CI pipeline. The developer knows within minutes, not hours, that a rule has been violated.
- **Baseline for existing violations:** When introducing new rules, existing violations are baselined. New code must not introduce new violations. The baseline is tracked and reduced over time.

---

# When To Use

- Any project with defined architecture rules.
- Teams where architecture violations have been a recurring issue.

---

# When NOT To Use

- Experimental/prototype codebases where architecture is intentionally fluid.

---

# Best Practices

- **Fail CI on architecture violations.** WHY: Soft warnings are ignored. The only way to merge a violation is to change the rule. This forces conscious decisions about architecture changes.
- **Run in parallel CI job.** WHY: Architecture tests run in a separate CI job from unit/feature tests. The architecture job completes faster and fails independently. Don't block on slower test suites.
- **Use baseline for legacy code.** WHY: When introducing strict rules in a codebase with existing violations, all PRs fail until legacy code is fixed. Developers become frustrated and disable the rules. Baseline existing violations and require new code to not introduce new ones.
- **Document exemptions explicitly.** WHY: When a legitimate violation exists (e.g., a shared utility), add it to an exemptions file. Exemptions are reviewed and approved periodically.

---

# Architecture Guidelines

- Pre-merge gate: architecture tests must pass.
- Fail fast: run early in CI pipeline.
- Separate CI job for architecture tests.
- PR comment on failure with violation details.
- Baseline degradation detection: fail if violations increase.
- Exemptions documented in a file, reviewed periodically.

---

# Performance Considerations

- Architecture tests: 1-5 seconds for 50-100 tests. Negligible in CI.

---

# Security Considerations

- CI tokens and secrets must not be exposed in architecture test output.

---

# Common Mistakes

1. **Architecture tests not in CI:** Tests exist locally but are not run in CI. Cause: CI configuration oversight. Consequence: developers forget to run them; violations are never caught. Better: run in CI as pre-merge gate.

2. **Ignoring CI failures:** Architecture tests fail but the PR is merged anyway. Cause: lack of enforcement. Consequence: the tests become noise that everyone ignores. Better: block merges on failure.

3. **No baseline for legacy code:** Introducing strict rules without baselining existing violations. Cause: not considering existing codebase state. Consequence: all PRs fail; developers disable the rules. Better: baseline existing violations and track reduction.

---

# Anti-Patterns

- **CI optional**: Architecture tests in CI but not required to pass. Ignored when they fail.
- **No baseline**: New rules applied retroactively to all code. Blocks all progress.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-01 Architecture testing | AEG-03 Static analysis rules | AEG-08 Drift detection |
| COS-12 CI/CD integration | AEG-05 Import violation detection | AEG-09 Refactoring remediation |

---

# AI Agent Notes

- Architecture tests must be a pre-merge gate in CI.
- Run in parallel CI job for fast feedback.
- Baseline existing violations before introducing new rules.
- Document exemptions explicitly.

---

# Verification

- [ ] Architecture tests run in CI on every PR
- [ ] CI blocks merges on architecture test failure
- [ ] Architecture tests run early in CI pipeline (fail fast)
- [ ] Baseline exists for existing violations
- [ ] Exemptions are documented and reviewed
- [ ] PR comments include violation details on failure
