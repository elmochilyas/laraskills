# ECC Anti-Patterns — Eager Providers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Eager Providers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Unintentional Eager Provider
2. Eager Provider Loading Large Datasets
3. God Eager Provider
4. Every Provider Eager by Default
5. Assuming Auto-Discovered Provider Is Deferred

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — eager providers should not perform database queries in boot
- Premature Caching — N/A

---

## Anti-Pattern 1: Unintentional Eager Provider

### Category
Performance

### Description
A package provider that should be deferred doesn't implement `DeferrableProvider`, adding overhead to every request.

### Why It Happens
Package authors don't implement `DeferrableProvider` for rarely-used services.

### Warning Signs
- Provider rarely used but loaded on every request
- `php artisan about` shows unexpected eager providers
- Provider adds measurable bootstrap time for unused functionality

### Why It Is Harmful
Every eager provider adds constructor + `register()` + `boot()` overhead (~0.1-0.5ms). A rarely-used provider (e.g., mail service used only on 1% of routes) should not pay this cost on every request.

### Preferred Alternative
Check `php artisan about` for unexpected eager providers. Use `dont-discover` + manual conditional registration for packages that don't implement `DeferrableProvider`.

### Detection Checklist
- [ ] Provider services used on <30% of routes
- [ ] No `DeferrableProvider` interface
- [ ] Provider loaded on every request but rarely used

### Related Rules
Eager Providers (05-rules.md): N/A

### Related Skills
Eager Providers (06-skills.md): N/A

### Related Decision Trees
Eager Providers (07-decision-trees.md): D01 — Eager vs Deferred.

---

## Anti-Pattern 2: Eager Provider Loading Large Datasets

### Category
Performance

### Description
Loading permissions, roles, or configuration from database in `boot()`.

### Preferred Alternative
Load data lazily when first needed, not in `boot()`.

### Detection Checklist
- [ ] Database queries in `boot()` of eager provider
- [ ] Large dataset loaded on every request

### Related Rules
Eager Providers (05-rules.md): N/A

### Related Skills
Eager Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: God Eager Provider

### Category
Architecture

### Description
Single provider registering everything, impossible to selectively defer.

### Preferred Alternative
Split into dedicated providers per domain concern.

### Detection Checklist
- [ ] Single provider registers unrelated services
- [ ] Cannot defer individual sub-systems

### Related Rules
Eager Providers (05-rules.md): N/A

### Related Skills
Eager Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Every Provider Eager by Default

### Category
Performance

### Description
Never using deferred providers — all 30+ providers are eager.

### Preferred Alternative
Audit providers: defer those used on <30% of routes.

### Detection Checklist
- [ ] No deferred providers
- [ ] High provider count, all eager

### Related Rules
Eager Providers (05-rules.md): N/A

### Related Skills
Eager Providers (06-skills.md): N/A

### Related Decision Trees
Eager Providers (07-decision-trees.md): D01 — Eager vs Deferred.

---

## Anti-Pattern 5: Assuming Auto-Discovered Provider Is Deferred

### Category
Performance

### Description
Assuming third-party packages implement `DeferrableProvider`.

### Preferred Alternative
Verify each package's provider via `php artisan about`.

### Detection Checklist
- [ ] Assumption without verification
- [ ] Unexpected bootstrap overhead

### Related Rules
Eager Providers (05-rules.md): N/A

### Related Skills
Eager Providers (06-skills.md): N/A

### Related Decision Trees
N/A
