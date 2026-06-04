# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mutation Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Mutation Testing Pipeline | Practice | High |
| 2 | Ignoring Escaped Mutations | Practice | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Mutation Testing Pipeline

### Category
Practice

### Description
Relying only on coverage without verifying tests catch logical changes.

### Why It Happens
Coverage easier. Mutation testing slower.

### Warning Signs
High coverage but bugs escape. No mutation testing in CI.

### Why Harmful
Coverage measures execution not assertion correctness.

### Consequences
False confidence. Bugs in well-covered code.

### Alternative
Integrate Infection. Set MSI target.

### Refactoring Strategy
1. Install Infection. 2. Run baseline. 3. Set MSI target. 4. CI enforcement.

### Detection Checklist
- [ ] Infection integrated
- [ ] MSI baseline established
- [ ] CI enforces target

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Use mutation testing for test quality
- 05-rules.md: Set minimum MSI in CI
- 06-skills.md: Set Up and Interpret Mutation Testing
- 07-decision-trees.md: Mutation Testing Strategy

---

## Anti-Pattern 2: Ignoring Escaped Mutations

### Category
Practice

### Description
Running mutation testing but not reviewing escaping mutants.

### Why It Happens
Run as checkbox. Output long and ignored.

### Warning Signs
Hundreds of escapes unreviewed. MSI known but not analyzed.

### Why Harmful
Escaped mutations are bugs waiting to happen.

### Consequences
Tests fail to catch logic errors.

### Alternative
Review each escape. Categorize: needs test, redundant, equivalent.

### Refactoring Strategy
1. Generate report. 2. Review escapes. 3. Write tests for true escapes.

### Detection Checklist
- [ ] Escapes reviewed
- [ ] True escapes improved
- [ ] Equivalent documented

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Review all escaped mutations
- 05-rules.md: Improve tests for non-equivalent
- 06-skills.md: Analyze and Address Escaped Mutations
- 07-decision-trees.md: Mutation Review Process

---
