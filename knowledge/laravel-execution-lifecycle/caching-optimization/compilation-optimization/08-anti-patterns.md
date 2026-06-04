# ECC Anti-Patterns — Compilation Optimization (ku-06)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Compilation Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Running `optimize` Without Context
2. Ignoring `optimize:force` in Production
3. Mixing Optimized and Unoptimized Environments
4. Not Profiling Before Optimization
5. Optimizing Everything Unconditionally

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — optimization does not address query performance
- Premature Caching — optimizing before understanding bottlenecks

---

## Anti-Pattern 1: Running `optimize` Without Context

### Category
Performance

### Description
Running `php artisan optimize` without understanding which parts of the framework it caches.

### Why It Happens
Developers treat `optimize` as a magic performance command.

### Warning Signs
- `optimize` run but individual caches still missing
- Team thinks `optimize` covers `event:cache`
- Some caches not regenerated

### Why It Is Harmful
`optimize` runs `config:cache` and `route:cache` but NOT `event:cache` in most versions. Teams relying on `optimize` alone miss the event cache benefit.

### Preferred Alternative
Run specific cache commands explicitly. Use `optimize` as supplementary, not primary.

### Detection Checklist
- [ ] Relying on `optimize` alone
- [ ] Events not cached despite `optimize`
- [ ] Missing individual cache files

### Related Rules
ku-06 (04-standardized-knowledge.md): Use optimize deliberately.

---

## Anti-Pattern 2: Ignoring `optimize:force` in Production

### Category
Reliability

### Description
Running `optimize` in production without `--force` when APP_ENV=production prevents some caching.

### Preferred Alternative
Use `php artisan optimize:force` or explicitly set `APP_ENV=production`.

### Detection Checklist
- [ ] `optimize` skipped in production
- [ ] Caching commands failing due to env check

### Related Rules
ku-06 (04-standardized-knowledge.md): Use optimize:force in production.

---

## Anti-Pattern 3: Mixing Optimized and Unoptimized Environments

### Category
Reliability

### Description
Having `bootstrap/cache/config.php` in `.gitignore` and deploying code that assumes cached files exist.

### Preferred Alternative
Ensure deployment always generates cache files before traffic hits.

### Detection Checklist
- [ ] Cache files in `.gitignore` but assumed present
- [ ] Missing cache errors in production

### Related Rules
ku-06 (04-standardized-knowledge.md): Consistent cache state across environments.

---

## Anti-Pattern 4: Not Profiling Before Optimization

### Category
Performance

### Description
Optimizing blindly without measuring which caching provides the most benefit.

### Preferred Alternative
Profile bootstrap time and identify the largest bottlenecks before deciding what to cache.

### Detection Checklist
- [ ] No profiling before optimization
- [ ] Optimizing unused areas

### Related Rules
ku-06 (04-standardized-knowledge.md): Profile before optimizing.

---

## Anti-Pattern 5: Optimizing Everything Unconditionally

### Category
Architecture

### Description
Running all cache commands even when not needed (e.g., view:cache for an API-only app).

### Preferred Alternative
Cache only what your application actually uses.

### Detection Checklist
- [ ] View cache generated for API-only app
- [ ] Unnecessary cache operations

### Related Rules
ku-06 (04-standardized-knowledge.md): Cache only what's needed.
