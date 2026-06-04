# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Accessibility Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Automated Accessibility Checks | Practice | Critical |
| 2 | Testing Only Criteria Not User Flows | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Automated Accessibility Checks

### Category
Practice

### Description
Not running automated a11y checks in CI pipeline.

### Why It Happens
Considered manual QA scope. Not knowing about a11y tools.

### Warning Signs
No a11y tests in CI. Issues found by users.

### Why Harmful
Accessibility issues accumulate. Legal risk.

### Consequences
Legal liability. Exclusion of users.

### Alternative
Integrate axe-core or Lighthouse CI. Fail on critical violations.

### Refactoring Strategy
1. Choose tool. 2. Add to CI. 3. Set thresholds. 4. Fix existing.

### Detection Checklist
- [ ] Automated a11y in CI
- [ ] Critical violations blocked
- [ ] No new violations

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Automate a11y checks in CI
- 05-rules.md: Block critical violations
- 06-skills.md: Integrate Automated A11y Testing
- 07-decision-trees.md: Automated A11y Strategy

---

## Anti-Pattern 2: Testing Only Criteria Not User Flows

### Category
Practice

### Description
Checking WCAG criteria without testing end-to-end a11y of flows.

### Why It Happens
Criteria-based. WCAG = accessible oversimplification.

### Warning Signs
Per-element compliance but flow breaks a11y.

### Why Harmful
WCAG is minimum. Real a11y requires journey testing.

### Consequences
Compliant but users still face barriers.

### Alternative
Test flows with assistive tech (keyboard, screen reader, zoom).

### Refactoring Strategy
1. Map journeys. 2. Test keyboard only. 3. Screen reader. 4. Zoom.

### Detection Checklist
- [ ] Flows tested for a11y
- [ ] Keyboard navigation
- [ ] Screen reader verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test a11y of complete flows
- 05-rules.md: Include assistive tech
- 06-skills.md: Test Accessibility of Complete Journeys
- 07-decision-trees.md: Accessibility Testing Scope

---
