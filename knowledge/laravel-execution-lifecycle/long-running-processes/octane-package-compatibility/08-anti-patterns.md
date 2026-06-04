# ECC Anti-Patterns — Octane Package Compatibility

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Octane Package Compatibility |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Forking Packages for Octane Compatibility
2. Deploying Without Package Audit
3. One-Time Audit With No Re-Evaluation
4. Blindly Enabling All Package Features
5. Assuming "No Errors" = "Compatible"

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — package compatibility is about state safety, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Forking Packages for Octane Compatibility

### Category
Maintainability

### Description
Creating permanent forks of packages that could be fixed via shims.

### Why It Happens
Forking is the first solution developers reach for when a package leaks state.

### Warning Signs
- `composer.json` references a forked repository
- Fork has diverged from upstream
- Upstream security patches not applied to fork

### Why It Is Harmful
Forks create a permanent maintenance burden — each upstream update must be manually merged. Shims (cleanup listeners, scoped overrides) are upgrade-safe and can be removed when the package adds official support.

### Preferred Alternative
Create application-side shims (RequestTerminated cleanup, scoped overrides) instead of forking.

### Detection Checklist
- [ ] Package repository points to fork
- [ ] Fork maintenance consuming team time
- [ ] Upstream security patches missed

### Related Rules
Package Compatibility (05-rules.md): N/A

### Related Skills
Package Compatibility (06-skills.md): N/A

### Related Decision Trees
Package Compatibility (07-decision-trees.md): D01 — Shim vs Fork Decision.

---

## Anti-Pattern 2: Deploying Without Package Audit

### Category
Reliability

### Description
Assuming all packages are compatible because "they're popular."

### Preferred Alternative
Audit all installed packages for Octane compatibility before deployment.

### Detection Checklist
- [ ] No pre-deployment package audit
- [ ] Popular packages assumed safe

### Related Rules
Package Compatibility (05-rules.md): N/A

### Related Skills
Package Compatibility (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: One-Time Audit With No Re-Evaluation

### Category
Maintainability

### Description
Auditing packages once before Octane deployment but never re-evaluating after updates.

### Preferred Alternative
Re-evaluate packages on each update. Run delta audit in CI.

### Detection Checklist
- [ ] Audit done once, never repeated
- [ ] Package updates introduce new singletons

### Related Rules
Package Compatibility (05-rules.md): N/A

### Related Skills
Package Compatibility (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Blindly Enabling All Package Features

### Category
Reliability

### Description
Enabling every feature of a package — some may be incompatible even if core works.

### Preferred Alternative
Feature-flag gate incompatible features.

### Detection Checklist
- [ ] All package features enabled
- [ ] Some features incompatible

### Related Rules
Package Compatibility (05-rules.md): N/A

### Related Skills
Package Compatibility (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Assuming "No Errors" = "Compatible"

### Category
Reliability

### Description
Assuming a package is compatible because it produces no errors — silent data corruption can occur.

### Preferred Alternative
Compare response outputs across sequential requests to verify isolation.

### Detection Checklist
- [ ] No errors but wrong results
- [ ] Silent data corruption

### Related Rules
Package Compatibility (05-rules.md): N/A

### Related Skills
Package Compatibility (06-skills.md): N/A

### Related Decision Trees
N/A
