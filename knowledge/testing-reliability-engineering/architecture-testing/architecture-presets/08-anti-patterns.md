# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Architecture Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Layer Dependency Enforcement | Structure | Critical |
| 2 | Not Testing Directory Structure Conventions | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Layer Dependency Enforcement

### Category
Structure

### Description
Not enforcing architectural boundaries via automated tests.

### Why It Happens
Rules understood by team. Code review catches violations.

### Warning Signs
Controllers contain business logic. Circular dependencies.

### Why Harmful
Architectural decay happens incrementally without enforcement.

### Consequences
Architecture decay. Difficult maintenance. Large rewrites needed.

### Alternative
Use architectural testing (PHPArkitect, Laravel architecture). Enforce in CI.

### Refactoring Strategy
1. Define layer rules. 2. Write architecture tests. 3. Enforce in CI.

### Detection Checklist
- [ ] Architecture rules defined
- [ ] Automated enforcement
- [ ] No circular deps

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Enforce architecture via tests
- 05-rules.md: CI fails on layer violations
- 06-skills.md: Implement Architecture Enforcement Tests
- 07-decision-trees.md: Architecture Testing Strategy

---

## Anti-Pattern 2: Not Testing Directory Structure Conventions

### Category
Practice

### Description
Not verifying classes follow directory conventions.

### Why It Happens
Assumption developers follow conventions.

### Warning Signs
Files in wrong directories. Multiple conventions.

### Why Harmful
Drift makes code harder to navigate.

### Consequences
Inconsistent structure. Onboarding difficulty.

### Alternative
Write tests asserting namespace-to-directory mapping.

### Refactoring Strategy
1. Define mapping. 2. Write assertion. 3. Enforce in CI.

### Detection Checklist
- [ ] Directory conventions defined
- [ ] Tests verify mapping
- [ ] CI enforces

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Verify directory conventions via tests
- 06-skills.md: Test Project Structure Conventions
- 07-decision-trees.md: Project Structure Enforcement

---
