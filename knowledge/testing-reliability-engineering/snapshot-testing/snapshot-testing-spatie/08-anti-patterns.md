# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Snapshot Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Unreviewed Snapshot Approvals | Practice | Critical |
| 2 | Snapshots for Frequently Changing Output | Practice | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Unreviewed Snapshot Approvals

### Category
Practice

### Description
Approving snapshot updates without reviewing the diff.

### Why It Happens
Just update snapshot command. No review step.

### Warning Signs
Snapshots pass despite output changes. Diffs not reviewed.

### Why Harmful
Approving without review masks real changes that could be bugs.

### Consequences
Bugs committed via snapshot updates.

### Alternative
Always review diffs before approval. Use --with-diff.

### Refactoring Strategy
1. Enforce diff review. 2. Add to PR checklist.

### Detection Checklist
- [ ] Diffs reviewed
- [ ] PR highlights snapshot changes
- [ ] Visual diff tool used

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Review all snapshot diffs
- 05-rules.md: Require review in PR
- 06-skills.md: Review Snapshot Diffs Effectively
- 07-decision-trees.md: Snapshot Approval Process

---

## Anti-Pattern 2: Snapshots for Frequently Changing Output

### Category
Practice

### Description
Using snapshots for output with timestamps, UUIDs, or generated IDs.

### Why It Happens
Snapshots easy. Not filtering variable data.

### Warning Signs
Tests require updating every run. Dynamic values in snapshots.

### Why Harmful
Frequent changes make snapshots useless.

### Consequences
Suite becomes noise. Developers blindly approve.

### Alternative
Filter dynamic values. Use partial matching for variable data.

### Refactoring Strategy
1. Identify dynamic values. 2. Filter before snapshot. 3. Targeted assertions.

### Detection Checklist
- [ ] Dynamic values filtered
- [ ] Stable for static structure
- [ ] Updates rare

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Filter dynamic values from snapshots
- 05-rules.md: Use targeted assertions for variable data
- 06-skills.md: Design Stable Snapshot Tests
- 07-decision-trees.md: Snapshot vs Assertion Decision

---
