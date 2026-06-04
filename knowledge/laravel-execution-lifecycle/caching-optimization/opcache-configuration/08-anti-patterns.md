# ECC Anti-Patterns — Opcache Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Opcache Configuration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Default opcache Settings on Large Apps
2. `validate_timestamps=1` in Production
3. No Opcache Monitoring
4. Not Warming Opcache on Deploy
5. `opcache.max_accelerated_files` Too Low

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — opcache does not affect database performance
- Premature Caching — tuning opcache before profiling file I/O

---

## Anti-Pattern 1: Default opcache Settings on Large Apps

### Category
Performance

### Description
Using PHP's default opcache settings on a Laravel app with thousands of files.

### Why It Happens
Developers don't configure opcache at all, relying on defaults.

### Warning Signs
- Low opcache hit rate (< 90%)
- Opcache running out of memory
- Files frequently evicted and re-cached

### Why It Is Harmful
Default `opcache.memory_consumption=128M` and `opcache.max_accelerated_files=2000` are too low for Laravel (4000+ PHP files). Opcache fills up, evicts entries, and re-caches them — wasting CPU.

### Preferred Alternative
Set `opcache.memory_consumption=256`, `opcache.max_accelerated_files=10000`, `opcache.interned_strings_buffer=16`.

### Detection Checklist
- [ ] Default opcache settings
- [ ] Low opcache hit rate
- [ ] Frequent cache evictions

### Related Rules
Opcache Configuration (04-standardized-knowledge.md): Tune settings for app size.

---

## Anti-Pattern 2: `validate_timestamps=1` in Production

### Category
Performance

### Description
Leaving file timestamp validation enabled in production, causing stat() calls on every request.

### Why It Happens
Developers copy php.ini from development to production.

### Preferred Alternative
Set `opcache.validate_timestamps=0` and `opcache.revalidate_freq=0` in production.

### Detection Checklist
- [ ] `validate_timestamps=1` in production
- [ ] Unnecessary stat calls per request

### Related Rules
Opcache Configuration (04-standardized-knowledge.md): Disable validation in production.

---

## Anti-Pattern 3: No Opcache Monitoring

### Category
Maintainability

### Description
Not monitoring opcache hit rate, memory usage, or eviction rate.

### Preferred Alternative
Use `opcache_get_status()` or monitoring tools to track opcache health.

### Detection Checklist
- [ ] No opcache monitoring
- [ ] Unknown hit rate or eviction stats

### Related Rules
Opcache Configuration (04-standardized-knowledge.md): Monitor opcache health.

---

## Anti-Pattern 4: Not Warming Opcache on Deploy

### Category
Performance

### Description
Deploying code without warming opcache — first requests compile from scratch.

### Preferred Alternative
Use a pre-warming script or request critical URLs after deploy.

### Detection Checklist
- [ ] No opcache warm step in deploy
- [ ] High latency on post-deploy requests

### Related Rules
Opcache Configuration (04-standardized-knowledge.md): Warm opcache after deploy.

---

## Anti-Pattern 5: `opcache.max_accelerated_files` Too Low

### Category
Performance

### Description
Setting `opcache.max_accelerated_files` below the number of PHP files in the app.

### Preferred Alternative
Count PHP files with `find . -name "*.php" | wc -l` and set `max_accelerated_files` to 2-3x the count.

### Detection Checklist
- [ ] `max_accelerated_files` below app file count
- [ ] High file I/O despite opcache enabled

### Related Rules
Opcache Configuration (04-standardized-knowledge.md): Set based on file count.
