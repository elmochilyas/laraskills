# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module isolation enforcement: linting and CI rules
Knowledge Unit ID: MMD-12
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Module isolation enforcement uses automated tools to detect and prevent violations of module boundaries. Without enforcement, modular structure degrades as developers take shortcuts — importing implementation classes from other modules, querying cross-module tables, creating circular dependencies. Enforcement combines architecture tests (Pest/PHPUnit), static analysis (PHPStan custom rules), and CI checks running on every PR. Enforcement makes a modular monolith real rather than aspirational.

---

# Core Concepts

- **What to enforce**: Module A cannot import implementation classes from Module B (only contracts). Module A cannot query Module B's database tables directly. Dependency declarations match actual imports. No circular dependencies.
- **Enforcement layers**: Static analysis (PHPStan) → Architecture tests (Pest) → CI checks (custom scripts).

---

# When To Use

- Every modular monolith from day one. Start strict and relax if needed — easier than introducing enforcement later.

---

# When NOT To Use

- Only when team explicitly decides to use convention-based enforcement (requires high discipline and regular audits).

---

# Best Practices

- **Enforce strictly from the start.** WHY: It's easier to start strict and relax than to introduce enforcement later (which requires fixing existing violations).
- **Baseline existing violations.** WHY: When introducing enforcement to an existing codebase, create a baseline of current violations and only block new ones. Otherwise, enforcement will be blocked by too many existing issues.
- **Make enforcement a required CI check.** WHY: If the step is allowed to fail, it will always fail and be ignored. Blocking enforcement is the only way it works.
- **Allow explicit whitelisting for exceptions.** WHY: Some legitimate cross-module imports exist (rare). Whitelist with required justification.

---

# Architecture Guidelines

- Contract-only import rule: Modules can only import from other modules' Contracts/ namespaces.
- Database table ownership rule: Each module owns specific table prefixes. Queries against other modules' tables are flagged.
- Dependency graph cycle detection in CI: Build dependency graph, fail if cycles detected.

---

# Performance Considerations

- Enforcement runs offline (CI, local development). Full dependency analysis adds 10-30s to CI. No runtime impact.

---

# Security Considerations

- Enforcement is architectural — no direct security implications. However, preventing unauthorized cross-module data access has security benefits.

---

# Common Mistakes

1. **No enforcement:** Modular structure exists but anyone can import anything. Cause: trust in developer discipline. Consequence: within 3 months, modules are just folders. Better: enforce from day one.

2. **Only testing one direction:** Testing that Domain doesn't depend on Infrastructure, but missing cross-module import violations. Cause: focusing on layer isolation instead of module isolation. Consequence: cross-module coupling grows unchecked.

3. **Over-relying on directory structure:** Assuming file location prevents imports. Cause: naivety. Consequence: code provides no protection — only enforcement does.

---

# Anti-Patterns

- **Enforcement paralysis**: So many rules that every PR is blocked. Team bypasses enforcement by disabling it.
- **Stale baseline**: Baseline of "acceptable" violations grows over time. New violations added to baseline instead of fixed.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-09 Module dependency mgmt | AEG-01 Architecture testing | AEG-03 PHPStan custom rules |
| MMD-06 Sync inter-module comm | AEG-02 CI enforcement | AEG-08 Drift detection |

---

# AI Agent Notes

- Generate PHPStan custom rules for module isolation when scaffolding modules.
- Create Pest architecture tests per module for contract-only import enforcement.
- Include CI dependency check scripts.

---

# Verification

- [ ] PHPStan rules enforce contract-only cross-module imports
- [ ] Architecture tests verify module isolation
- [ ] CI blocks cross-module import violations
- [ ] CI blocks circular dependencies
- [ ] Enforcement is a required (not optional) CI step
