# ECC Anti-Patterns — Provider Sprawl and Governance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Provider Sprawl and Governance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Unchecked Provider Growth
2. God Provider After Consolidation
3. Alert Fatigue from Budget Violations
4. Only Counting Manual Providers
5. Adding Without Checking Existing Duplicates

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — provider governance is about bootstrap performance, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Unchecked Provider Growth

### Category
Performance

### Description
Adding providers without governance — provider count doubles every year with no review.

### Why It Happens
Each individual provider addition seems reasonable; the cumulative effect is invisible until TTFB degrades.

### Warning Signs
- 50+ providers with no audit history
- Bootstrap time increasing over releases
- No provider budget or count tracking

### Why It Is Harmful
Each eager provider adds ~0.1-0.5ms bootstrap time. 100 providers = 10-50ms. Over a year of uncontrolled growth, TTFB degrades silently, affecting every request.

### Preferred Alternative
Set a provider budget (e.g., 30 max). Enforce via CI. Perform quarterly audits.

### Detection Checklist
- [ ] Provider count > 50
- [ ] No provider budget defined
- [ ] Bootstrap time degrading over time

### Related Rules
Provider Sprawl (05-rules.md): N/A

### Related Skills
Provider Sprawl (06-skills.md): N/A

### Related Decision Trees
Provider Sprawl (07-decision-trees.md): D01 — Provider Audit Decision.

---

## Anti-Pattern 2: God Provider After Consolidation

### Category
Architecture

### Description
Creating a single massive provider that registers unrelated services during sprawl remediation.

### Preferred Alternative
Consolidate within domain boundaries only.

### Detection Checklist
- [ ] Single provider with unrelated bindings
- [ ] Consolidation without domain separation

### Related Rules
Provider Sprawl (05-rules.md): N/A

### Related Skills
Provider Sprawl (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Alert Fatigue from Budget Violations

### Category
Workflow

### Description
Setting a provider budget too low, violated frequently, team ignores alerts.

### Preferred Alternative
Set realistic budget based on actual application needs.

### Detection Checklist
- [ ] CI budget check always failing
- [ ] Team ignores provider count alerts

### Related Rules
Provider Sprawl (05-rules.md): N/A

### Related Skills
Provider Sprawl (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Only Counting Manual Providers

### Category
Performance

### Description
Counting only providers in `bootstrap/providers.php`, ignoring auto-discovered providers.

### Preferred Alternative
Count both manual and auto-discovered providers.

### Detection Checklist
- [ ] Audit ignores `bootstrap/cache/packages.php`
- [ ] Underestimates true provider count

### Related Rules
Provider Sprawl (05-rules.md): N/A

### Related Skills
Provider Sprawl (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Adding Without Checking Existing Duplicates

### Category
Reliability

### Description
Adding a new provider without checking if another provider already registers the same binding.

### Preferred Alternative
Check `$app->bound()` before adding new binding.

### Detection Checklist
- [ ] Duplicate bindings from multiple providers
- [ ] Unintended binding overrides

### Related Rules
Provider Sprawl (05-rules.md): N/A

### Related Skills
Provider Sprawl (06-skills.md): N/A

### Related Decision Trees
N/A
