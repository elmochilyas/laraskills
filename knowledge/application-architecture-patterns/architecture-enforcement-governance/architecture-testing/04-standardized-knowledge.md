# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Architecture testing (Pest tests for architecture rules)
Knowledge Unit ID: AEG-01
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Architecture testing encodes architectural rules as automated tests. Instead of relying on code reviews to catch violations, tests verify that code structure conforms to the architecture. Rules include: "Services may not call Controllers," "Bounded Context A may not import from Bounded Context B," "All repositories must implement RepositoryInterface." Pest architecture testing (using `pestphp/pest-plugin-arch`) executes these rules on every CI run.

---

# Core Concepts

- **Architecture test:** An automated assertion about code structure. Tests check import direction, class inheritance, naming conventions, method signatures, and namespace placement.
- **Import direction rule:** "Classes in `App\Modules\Checkout` may not import from `App\Modules\Inventory`." Prevents unauthorized cross-context dependencies.
- **Layer rule:** "Controllers may only call Services. Services may only call Repositories."
- **Naming convention rule:** "All services must be in the `Services` namespace." "All controllers must end with `Controller`."

---

# When To Use

- Enforcing dependency direction between layers.
- Enforcing bounded context isolation.
- Enforcing naming conventions.
- Any structural rule that should never be violated.

---

# When NOT To Use

- Performance constraints (use load testing).
- Runtime behavior (use integration tests).
- Transient rules you plan to remove soon.

---

# Best Practices

- **Run architecture tests on every PR.** WHY: Architecture tests are part of the CI pipeline. A PR that violates the rules is blocked. Catches violations before they reach production.
- **Define rules in a single file.** WHY: All architecture tests live in `tests/Architecture/`. Makes rules visible to the entire team. Anyone can read them to understand the architecture.
- **Start with strict rules.** WHY: Begin with strict rules and loosen if they cause friction. It is easier to relax a rule than to add one later. Use `->ignoring()` for legitimate exceptions.
- **Use Pest architecture tests as default.** WHY: They are simpler, more readable, and sufficient for most import rules. Only use custom PHPStan rules for constraints that the test framework cannot express.

---

# Architecture Guidelines

- Test import direction rules.
- Test context isolation rules.
- Test naming convention rules.
- Test layer dependency rules.
- Living in `tests/Architecture/`.
- Run in CI as a pre-merge gate.

---

# Performance Considerations

- Run in CI only (zero production impact). 50-100 architecture tests take 1-5 seconds.

---

# Security Considerations

- Architecture tests don't handle sensitive data. No security concerns.

---

# Common Mistakes

1. **No architecture tests:** Architecture rules are in documentation only. Cause: not adopting the practice. Consequence: no one reads them; violations accumulate silently. Better: encode rules as automated tests.

2. **Rules that are too strict:** Enforcing rules that prevent legitimate patterns. Cause: not considering edge cases. Consequence: developers work around or disable the rules. Better: use `->ignoring()` for legitimate exceptions.

3. **Rules not run in CI:** Architecture tests exist but are only run locally. Cause: CI misconfiguration. Consequence: violations are never automatically caught. Better: run in CI as pre-merge gate.

---

# Anti-Patterns

- **Paper architecture**: Rules exist in a wiki/confluence page but are never enforced.
- **False security**: Architecture tests exist but don't cover the most important rules.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Dependency direction | AEG-02 CI enforcement | AEG-05 Import violation detection |
| DBC-01 Bounded context basics | AEG-03 Static analysis rules | AEG-08 Drift detection |

---

# AI Agent Notes

- Encode every architectural rule as a Pest architecture test.
- Run on every PR in CI as a pre-merge gate.
- Start strict, loosen with `->ignoring()` for legitimate cases.
- Define all rules in `tests/Architecture/`.

---

# Verification

- [ ] Architecture tests exist for dependency direction rules
- [ ] Architecture tests exist for context isolation rules
- [ ] Architecture tests exist for naming conventions
- [ ] Tests are in `tests/Architecture/`
- [ ] Tests run in CI and block merges on failure
- [ ] Exception list (`->ignoring()`) is reviewed periodically
