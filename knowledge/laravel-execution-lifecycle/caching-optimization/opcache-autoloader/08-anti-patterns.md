# ECC Anti-Patterns — Opcache Autoloader (ku-07)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Opcache Autoloader |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No opcache Settings Tuning
2. Using `files` in `composer.json` Inefficiently
3. Ignoring `opcache.validate_timestamps=0` in Production
4. Not Warming Opcache on Deploy
5. Monolithic Classmap Without Profiling

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — opcache addresses PHP file I/O, not database
- Premature Caching — optimizing class loading before measuring bottlenecks

---

## Anti-Pattern 1: No opcache Settings Tuning

### Category
Performance

### Description
Running with default opcache settings (especially `opcache.max_accelerated_files=2000`) on a large Laravel app.

### Why It Happens
Developers assume default PHP opcache settings are sufficient.

### Warning Signs
- `opcache.stat` hit rate below 90%
- Opcache running out of memory
- PHP file I/O still high after deploying

### Why It Is Harmful
Default `opcache.max_accelerated_files=2000` (PHP < 8.0) is too low for a typical Laravel app with 4000+ files. Opcache evicts entries, negating caching.

### Preferred Alternative
Set `opcache.max_accelerated_files=10000+` and `opcache.memory_consumption=256M+` based on application size.

### Detection Checklist
- [ ] Default opcache settings
- [ ] Low opcache hit rate
- [ ] High file I/O with opcache enabled

### Related Rules
ku-07 (04-standardized-knowledge.md): Tune opcache settings for Laravel size.

---

## Anti-Pattern 2: Using `files` in `composer.json` Inefficiently

### Category
Performance

### Description
Listing many runtime helper files in the `files: [...]` array, causing them to load on every request.

### Why It Happens
Developers add files to `files` autoload for convenience, not realizing they're always loaded.

### Warning Signs
- Long `files` array with rarely-used helper files
- Files loaded on every request but only used by specific endpoints

### Why It Is Harmful
Each file in the `files` autoload array is loaded on every request — even if only one endpoint uses it. This adds I/O and parse time to every request's bootstrap.

### Preferred Alternative
Use class autoloading or lazy-load helper files only when needed.

### Detection Checklist
- [ ] Rarely-used files in `files: [...]`
- [ ] Files loaded on every request unnecessarily

### Related Rules
ku-07 (04-standardized-knowledge.md): Use class autoloading for rarely-used helpers.

---

## Anti-Pattern 3: Ignoring `opcache.validate_timestamps=0` in Production

### Category
Performance

### Description
Leaving `opcache.validate_timestamps=1` in production, causing opcache to check file mtimes on every request.

### Why It Happens
Developers configure opcache locally for development (where validation is needed) and forget to change for production.

### Preferred Alternative
Set `opcache.validate_timestamps=0` and `opcache.revalidate_freq=0` in production.

### Detection Checklist
- [ ] `opcache.validate_timestamps=1` in production
- [ ] Unnecessary file stat calls on every request

### Related Rules
ku-07 (04-standardized-knowledge.md): Disable timestamp validation in production.

---

## Anti-Pattern 4: Not Warming Opcache on Deploy

### Category
Performance

### Description
Deploying code without warming opcache — first requests to each file trigger compilation.

### Why It Happens
Deployment scripts focus on Laravel caches and miss opcache warming.

### Warning Signs
- High latency on first requests after deploy
- CPU spikes after deploy

### Preferred Alternative
Use a `php artisan opcache:warm` script or request critical URLs after deploy.

### Detection Checklist
- [ ] No opcache warming in deploy
- [ ] High latency on post-deploy requests

### Related Rules
ku-07 (04-standardized-knowledge.md): Warm opcache after deploy.

---

## Anti-Pattern 5: Monolithic Classmap Without Profiling

### Category
Performance

### Description
Generating a full `dump-autoload -o` for every deployment without profiling whether it's needed.

### Preferred Alternative
Profile bootstrap time first. Use classmap only if composer loading is a bottleneck.

### Detection Checklist
- [ ] Unnecessary optimization overhead
- [ ] No profiling before classmap generation

### Related Rules
ku-07 (04-standardized-knowledge.md): Profile before optimizing class loading.
