# ECC Anti-Patterns — Optimize Command

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Optimize Command |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Blind Optimize All
2. Optimize Without Maintenance Mode
3. Not Clearing Before Optimizing
4. Optimize in CI Artifacts
5. `optimize:clear` Without Rebuild Strategy

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — optimize is for file caches, not database
- Premature Caching — optimizing before profiling

---

## Anti-Pattern 1: Blind Optimize All

### Category
Performance

### Description
Running `php artisan optimize --all` or equivalent without understanding what each optimization does.

### Why It Happens
Developers treat "more optimization = more performance" without granular understanding.

### Warning Signs
- `optimize` run without selective caching
- View cache generated for API-only app

### Why It Is Harmful
Some optimizations (like view caching for API apps) waste deployment time and disk space with no benefit.

### Preferred Alternative
Selectively run only the cache commands your application needs.

### Detection Checklist
- [ ] Running all optimizations indiscriminately
- [ ] Unnecessary cache files generated

### Related Rules
Optimize Command (04-standardized-knowledge.md): Selective optimization.

---

## Anti-Pattern 2: Optimize Without Maintenance Mode

### Category
Reliability

### Description
Regenerating all caches without putting the app in maintenance mode first.

### Preferred Alternative
Use `php artisan down` before cache operations, `php artisan up` after.

### Detection Checklist
- [ ] Cache regeneration without maintenance mode
- [ ] Race condition between old/new cache state

### Related Rules
Optimize Command (04-standardized-knowledge.md): Use maintenance mode.

---

## Anti-Pattern 3: Not Clearing Before Optimizing

### Category
Reliability

### Description
Running `optimize` without `optimize:clear` first — old cache files with different structure remain.

### Preferred Alternative
Always clear before regenerating: `optimize:clear && optimize`.

### Detection Checklist
- [ ] Old cache remnants after optimize
- [ ] Inconsistent cache state

### Related Rules
Optimize Command (04-standardized-knowledge.md): Clear before optimize.

---

## Anti-Pattern 4: Optimize in CI Artifacts

### Category
Workflow

### Description
Running `optimize` during CI build and including cache files in deployment artifacts.

### Preferred Alternative
Generate caches on the deploy target, not in CI artifacts.

### Detection Checklist
- [ ] Cache files in CI artifacts
- [ ] Environment-specific config cached in CI

### Related Rules
Optimize Command (04-standardized-knowledge.md): Optimize on target, not CI.

---

## Anti-Pattern 5: `optimize:clear` Without Rebuild Strategy

### Category
Reliability

### Description
Running `optimize:clear` but not immediately regenerating caches.

### Preferred Alternative
Always pair `optimize:clear` with an immediate `optimize` in automated scripts.

### Detection Checklist
- [ ] `optimize:clear` without subsequent `optimize`
- [ ] Uncached application state

### Related Rules
Optimize Command (04-standardized-knowledge.md): Clear only before rebuild.
