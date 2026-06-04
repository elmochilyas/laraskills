# ECC Anti-Patterns — Service Binding Audit

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Service Binding Audit |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. One-Time Audit With No Follow-Up
2. Blind Mass Conversion
3. Ignoring Transitive Dependencies
4. Skipping Package Audit
5. Auditing Only Application Code

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — binding audit is about state safety, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: One-Time Audit With No Follow-Up

### Category
Architecture

### Description
A thorough initial audit that is never repeated — 6 months later it's worthless.

### Why It Happens
Audits are treated as a deployment milestone, not an ongoing practice.

### Warning Signs
- Audit report timestamp is months old
- New providers added since the audit
- CI does not enforce binding safety

### Why It Is Harmful
New code introduces new singletons, packages update, developers forget about state safety. Without continuous auditing, unsafe bindings creep back in within weeks.

### Preferred Alternative
Run delta audits in CI on every PR. Re-audit fully on each major deployment.

### Detection Checklist
- [ ] Single audit done once
- [ ] New bindings added post-audit
- [ ] No CI enforcement

### Related Rules
Binding Audit (05-rules.md): N/A

### Related Skills
Binding Audit (06-skills.md): N/A

### Related Decision Trees
Binding Audit (07-decision-trees.md): D01 — Audit Frequency Decision.

---

## Anti-Pattern 2: Blind Mass Conversion

### Category
Architecture

### Description
Converting every singleton to scoped "to be safe."

### Preferred Alternative
Audit each binding individually. Only convert singletons with mutable per-request state.

### Detection Checklist
- [ ] All singletons converted to scoped
- [ ] Infrastructure services broken

### Related Rules
Binding Audit (05-rules.md): N/A

### Related Skills
Binding Audit (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Ignoring Transitive Dependencies

### Category
Reliability

### Description
Only auditing direct bindings without tracing their dependency graph.

### Preferred Alternative
Trace full dependency graph — a safe singleton depending on an unsafe one is itself unsafe.

### Detection Checklist
- [ ] Dependency graph not analyzed
- [ ] Transitive leaks missed

### Related Rules
Binding Audit (05-rules.md): N/A

### Related Skills
Binding Audit (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Skipping Package Audit

### Category
Reliability

### Description
Assuming all packages are Octane-safe because they're popular.

### Preferred Alternative
Audit all registered providers, including vendor packages.

### Detection Checklist
- [ ] Vendor packages not audited
- [ ] Package singletons leaking

### Related Rules
Binding Audit (05-rules.md): N/A

### Related Skills
Binding Audit (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Auditing Only Application Code

### Category
Maintainability

### Description
Auditing only `App\Providers` and ignoring auto-discovered package providers.

### Preferred Alternative
Include all registered providers in the audit scope.

### Detection Checklist
- [ ] Only app providers audited
- [ ] Package providers missed

### Related Rules
Binding Audit (05-rules.md): N/A

### Related Skills
Binding Audit (06-skills.md): N/A

### Related Decision Trees
N/A
