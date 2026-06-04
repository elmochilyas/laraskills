# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Refactoring and remediation workflows
Knowledge Unit ID: AEG-09
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Refactoring and remediation workflows fix architectural violations systematically. The workflow: detect violation, assess impact, plan remediation, execute, verify. Refactoring is not free — each remediation has a cost-benefit calculation. Critical violations (broken context isolation, circular dependencies) are fixed immediately. Low-risk violations (naming inconsistencies) are grouped into periodic cleanup sprints.

---

# Core Concepts

- **Remediation priority:** Violations are classified by severity — critical (broken isolation), high (unauthorized import), medium (missing contract), low (naming). Priority determines when the remediation is scheduled.
- **Strangler remediation:** For large-scale refactoring (extracting a context, fixing a circular dependency), use the strangler approach: work around the violation while building the correct structure, then remove the violation in a final pass.
- **Verification:** After remediation, architecture tests must pass. The drift score must not increase. CI blocks the remediation if it introduces new violations.

---

# When To Use

- Fixing known architectural violations.
- Reducing drift score over time.

---

# When NOT To Use

- Experimental or throwaway code.
- Modules scheduled for complete rewrite next quarter.

---

# Best Practices

- **Fix critical violations immediately.** WHY: Critical violations block the CI pipeline or cause production issues. Allocate time from the current sprint. Don't let them accumulate.
- **Group low-severity violations.** WHY: Low-severity violations are collected in a backlog. A dedicated refactoring sprint (every 4-6 weeks) addresses them in bulk. Context switching for each low-severity fix is wasteful.
- **Use strangler for large refactoring.** WHY: When fixing a deep violation (e.g., removing an entire dependency), build the alternative path first, then remove the old path. Never remove while the old path is still needed. This approach is safe and incremental.
- **Apply the boy scout rule.** WHY: Small violations fixed as they are introduced (boy scout rule: leave the codebase cleaner than you found it) is cheaper than large remediation projects. Fix violations in the code you touch.
- **Verify after remediation.** WHY: After remediation, architecture tests must pass and the drift score must not increase. Without verification, the violation may not be fully fixed.

---

# Architecture Guidelines

- Workflow: Detect → Classify → Plan → Remediate → Verify.
- Severity: Critical → High → Medium → Low.
- Critical = fix immediately.
- Low = backlog for cleanup sprint.
- Large refactoring = strangler pattern.
- Boy scout rule for small violations.
- Verify with architecture tests after remediation.

---

# Performance Considerations

- Refactoring is development-time cost. No production performance impact.

---

# Security Considerations

- Remediation workflows should include security review if the violation has security implications.

---

# Common Mistakes

1. **Ignoring violations:** "We will fix it later." Cause: deferring without tracking. Consequence: later never comes; the violation becomes part of the norm. Better: track all violations in backlog with priority.

2. **Big-bang refactoring:** Stopping all feature work to fix all architectural violations at once. Cause: wanting a clean slate. Consequence: high risk, long period without value delivery. Better: incremental strangler approach.

3. **No verification:** Refactoring is done but not verified by architecture tests. Cause: skipping the verify step. Consequence: the violation may not be fully fixed. Better: verify with architecture tests in CI.

---

# Anti-Patterns

- **Fix-it-later**: Violations deferred indefinitely. Architecture degrades.
- **Big-bang rewrite**: Stop everything to fix all violations at once. High risk, no delivery.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-08 Drift detection | AEG-01 Architecture testing | MMD-11 Module extraction |
| AEG-05 Import violation detection | AEG-02 CI enforcement | DBC-10 Legacy integration |

---

# AI Agent Notes

- Classify violations by severity.
- Fix critical immediately, backlog low-severity.
- Use strangler approach for large refactoring.
- Always verify with architecture tests after remediation.

---

# Verification

- [ ] Violations are classified by severity
- [ ] Critical violations are fixed immediately
- [ ] Low-severity violations are tracked in backlog
- [ ] Large refactoring uses strangler approach
- [ ] Boy scout rule is practiced (fix violations in code you touch)
- [ ] Remediation is verified by architecture tests in CI
