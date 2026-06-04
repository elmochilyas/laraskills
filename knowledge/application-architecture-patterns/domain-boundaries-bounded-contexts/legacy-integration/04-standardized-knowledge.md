# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Integrating legacy systems at context boundaries
Knowledge Unit ID: DBC-10
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Legacy integration at context boundaries uses Anti-Corruption Layer (ACL) and Strangler Fig patterns to isolate the new system from legacy contamination. ACL translates between legacy and new domain models. Strangler Fig gradually replaces legacy functionality by routing specific features to the new system. Goal: protect new bounded context's model integrity while incrementally replacing the legacy system.

---

# Core Concepts

- **ACL**: Translates between legacy model and new context model. Prevents legacy terminology and schema from leaking.
- **Strangler Fig**: Incrementally replaces legacy functionality. Route by route, feature by feature.
- **Legacy model isolation**: New context never imports legacy classes directly. All interaction through ACL.

---

# When To Use

- Legacy system with fundamentally different model that would corrupt new context.
- Large legacy system that cannot be replaced in one effort.

---

# When NOT To Use

- Strangler Fig without ACL (passes legacy data structures through).
- Full rewrite attempt (high risk of failure, long period without shipping).

---

# Best Practices

- **Always pair Strangler Fig with ACL.** WHY: Strangler replaces functionality but without ACL, legacy data structures pass through. The new system inherits legacy model problems.
- **Use feature-flag based routing.** WHY: New features go to new system, old stay on legacy. When a feature is migrated, remove the flag. Enables incremental, safe migration.
- **Use write-through + read-through during migration.** WHY: Writes go to both systems (legacy + new). Reads come from new system. Verifies correctness during migration without affecting users.
- **Never attempt a full rewrite.** WHY: Replacing an entire legacy system at once has high failure risk. Strangler Fig with ACL is the proven approach.

---

# Architecture Guidelines

- ACL in the new context's boundary. Translates both directions (`toDomain()`, `toLegacy()`).
- Strangler Fig routing via feature flags.
- Legacy facade wraps legacy system API providing clean interface.

---

# Performance Considerations

- ACL adds translation overhead per call (microseconds).
- Dual operation during migration doubles write workload.

---

# Security Considerations

- ACL provides security isolation — only translated data crosses the boundary.

---

# Common Mistakes

1. **No ACL:** Importing legacy models directly into new context. Cause: convenience. Consequence: legacy schema infects new domain model. Better: build ACL.

2. **Strangler Fig without ACL:** Replaces functionality but passes legacy data structures through. Cause: incomplete migration plan. Consequence: new system inherits legacy problems. Better: ACL translates.

3. **Full rewrite attempt:** Replace entire legacy at once. Cause: ambition. Consequence: high failure risk. Better: Strangler Fig.

---

# Anti-Patterns

- **Legacy model imported directly**: New context coupled to legacy schema.
- **Migration without rollback**: No way to revert if new system fails.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-04 Anti-corruption layer | DBC-11 Multi-context transactions | DBC-12 Eventual consistency |
| MMD-11 Module extraction | CPC-07 Bridge/adapter pattern | AEG-09 Refactoring remediation |

---

# AI Agent Notes

- Always generate ACL when integrating with legacy systems.
- Use Strangler Fig for incremental replacement.
- Never bypass ACL with direct legacy imports.

---

# Verification

- [ ] ACL translates between legacy and new models
- [ ] Strangler Fig replaces functionality incrementally
- [ ] No direct legacy model imports in new context
- [ ] Feature flags control migration routing
- [ ] Write-through verifies correctness during migration
