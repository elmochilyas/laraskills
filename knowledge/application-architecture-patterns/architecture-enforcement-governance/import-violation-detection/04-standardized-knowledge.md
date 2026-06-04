# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Import violation detection
Knowledge Unit ID: AEG-05
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Import violation detection prevents code in one bounded context from importing classes in another context that it should not depend on. The detection layer scans all PHP `use` statements and matches them against a dependency map. If an import is not in the allowed list, it is flagged. Detection runs in CI and can be surfaced in the IDE.

---

# Core Concepts

- **Dependency map:** A matrix of allowed imports between contexts. Context A can import from Context B and C, but not from Context D. The map is documented in the architecture guide and encoded in tests.
- **Explicit allowlist:** Each context has a list of contexts it is allowed to import from. Imports from any other context are violations.
- **Transitive dependency:** If Context A imports from Context B, and Context B imports from Context C, Context A effectively depends on Context C. Detection must catch this.

---

# When To Use

- Preventing unauthorized coupling between bounded contexts.
- Enforcing the dependency direction rules.

---

# When NOT To Use

- Single-context applications (no cross-context imports to protect).

---

# Best Practices

- **Default to strict.** WHY: Every context starts with an empty allowlist. Imports are added explicitly as needed. Prevents accidental coupling from the start.
- **Use Pest architecture tests for import rules.** WHY: They are clean and readable. Example: `test('Checkout may only import from Shared and Billing')`.
- **Use namespace-based detection.** WHY: All classes within a bounded context share a namespace (`App\Modules\Checkout`). Detection checks the namespace of every import.
- **Detect transitive dependencies.** WHY: If Context A imports from Context B which imports from Context C, A effectively depends on C. Detection must flag this.
- **Shared kernel as exception.** WHY: All contexts may import from the `Shared` kernel. The shared kernel is gated — only common types and contracts live there.

---

# Architecture Guidelines

- Dependency map: matrix of allowed imports.
- Explicit allowlist per context.
- Namespace-based detection of imports.
- Pest architecture tests for import rules.
- Transitive dependency detection.
- Shared kernel is the only universal allowlist.
- IDE integration via PHPStan rule.

---

# Performance Considerations

- Import scanning runs in CI (seconds). No production impact.

---

# Security Considerations

- Import detection prevents code from accessing unauthorized internal APIs. Supports the principle of least privilege.

---

# Common Mistakes

1. **No detection:** Unauthorized cross-context imports accumulate silently. Cause: not implementing detection. Consequence: the core coupling becomes untangled and undocumented. Better: implement dependency map and enforce with tests.

2. **Transitive dependency blind spot:** Detection only checks direct imports, not transitive ones. Cause: simple detection implementation. Consequence: Context A imports B which imports C — A effectively couples to C undetected. Better: detect transitive dependencies.

3. **Detection without enforcement:** Violations are reported but not enforced. Cause: CI configuration issue. Consequence: imports bypass the detection system (e.g., using fully qualified class names). Better: run detection in CI as pre-merge gate.

---

# Anti-Patterns

- **No import detection**: Unauthorized cross-context imports grow silently.
- **Only direct checks**: Transitive dependencies go undetected.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Bounded context basics | AEG-01 Architecture testing | AEG-03 Static analysis rules |
| DBC-05 Context mapping | AEG-02 CI enforcement | AEG-08 Drift detection |

---

# AI Agent Notes

- Encode dependency map as Pest architecture tests.
- Detect both direct and transitive import violations.
- Run detection in CI as pre-merge gate.
- IDE integration for real-time feedback.

---

# Verification

- [ ] Dependency map exists for all contexts
- [ ] Pest architecture tests enforce import rules
- [ ] Transitive dependencies are detected
- [ ] Detection runs in CI and blocks merges
- [ ] Shared kernel is the only universal allowlist
- [ ] IDE provides real-time import violation feedback
