# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Static analysis rules for architecture
Knowledge Unit ID: AEG-03
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Static analysis rules enforce architecture constraints at the code level without running tests. PHPStan (with custom rules) and Larastan can detect import violations, forbidden method calls, incorrect type usage, and missing contracts. Custom PHPStan rules extend the analysis to domain-specific constraints. Rules run on every save (IDE) and in CI.

---

# Core Concepts

- **PHPStan rule:** A class implementing `PHPStan\Rules\Rule`. Inspects AST nodes and reports errors when a violation is detected.
- **Custom architecture rule:** A PHPStan rule that checks project-specific constraints: "Repositories may not use the Auth facade." "Services must not return Eloquent models."
- **Collector:** Gathers information across multiple files. For example, collect all repository classes, then check they implement the correct interface.

---

# When To Use

- Constraints that require understanding the code's AST — type checks, method calls, class inheritance.
- Rules that Pest architecture tests cannot express.

---

# When NOT To Use

- Structural constraints (namespace imports) — Pest architecture tests are simpler and sufficient.
- When simpler alternatives (Pest architecture tests) cover the same rule.

---

# Best Practices

- **Default to Pest architecture tests.** WHY: They are simpler, more readable, and sufficient for most import rules. Only use custom PHPStan rules for constraints that the test framework cannot express.
- **Don't duplicate rules.** WHY: Writing PHPStan rules that duplicate existing Pest architecture tests adds maintenance without value. Choose one enforcement mechanism per rule.
- **Use static analysis for type-level constraints.** WHY: Static analysis understands the type system — method calls, type usage, class inheritance. These are harder to express in structural tests.
- **Integrate with CI.** WHY: Custom PHPStan rules must be included in CI to be effective. Local-only rules are forgotten.

---

# Architecture Guidelines

- Custom PHPStan rules for project-specific AST constraints.
- Larastan for framework-specific rules (Eloquent, routes).
- Disallowed classes/calls via `spaze/phpstan-disallowed-calls`.
- Run in CI alongside architecture tests.
- Do not duplicate Pest architecture tests.

---

# Performance Considerations

- Custom PHPStan rules run during static analysis. Adds analysis time (seconds to minutes) depending on rule complexity.

---

# Security Considerations

- Static analysis does not handle runtime data. No security issues.

---

# Common Mistakes

1. **Redundant rules:** Writing PHPStan rules that duplicate existing Pest architecture tests. Cause: not checking existing coverage. Consequence: adds maintenance without value. Better: use one mechanism per rule — prefer Pest for structural rules.

2. **Rules that are too specific:** Rules that check specific class names or method calls that change frequently. Cause: over-engineering. Consequence: rules break on refactoring. Better: check patterns, not specific names.

3. **No CI integration:** Custom PHPStan rules exist but are not included in CI. Cause: CI configuration oversight. Consequence: developers run them locally but they are not enforced. Better: include in CI pipeline.

---

# Anti-Patterns

- **PHPStan for everything**: Custom rules for every constraint, even simple import checks. Pest tests are simpler.
- **Redundant enforcement**: Both PHPStan rules and Pest tests enforce the same constraint.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-07 Static analysis | AEG-01 Architecture testing | AEG-05 Import violation detection |
| AEG-02 CI enforcement | COS-12 CI/CD integration | AEG-08 Drift detection |

---

# AI Agent Notes

- Default to Pest architecture tests. Use PHPStan rules only for AST-level constraints.
- Don't duplicate rules across Pest and PHPStan.
- Integrate custom rules into CI pipeline.
- Use `spaze/phpstan-disallowed-calls` for forbidden classes/methods.

---

# Verification

- [ ] Custom PHPStan rules exist for constraints Pest cannot express
- [ ] No duplication between PHPStan rules and Pest architecture tests
- [ ] Custom rules run in CI
- [ ] Larastan is configured for framework-specific checks
- [ ] Disallowed calls list is maintained
