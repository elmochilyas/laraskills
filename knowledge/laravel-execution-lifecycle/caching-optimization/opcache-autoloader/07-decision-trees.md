# Decision Trees: OpCache Autoloader (ku-07)

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** ku-07-opcache-autoloader
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-K07-01 | OpCache Configuration for Production | Performance | Medium | Per server setup |
| DT-K07-02 | validate_timestamps Setting | Performance | Medium | Per server setup |
| DT-K07-03 | Composer Autoloader Mode (-o vs -a) | Performance | Medium | Per deployment strategy |

---

## DT-K07-01: OpCache Configuration for Production

### Decision Context
- **When to decide:** During production server configuration
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Setting up PHP configuration for Laravel production
- **Constraint:** OpCache must be enabled with sufficient memory to hold all compiled PHP files

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| PHP file count | High | Must set max_accelerated_files above total .php file count |
| Memory budget | High | Insufficient memory causes cache thrashing |
| Runtime environment | Medium | Octane vs FPM affects memory sizing strategy |

### Decision Tree

```
Is OpCache already enabled?
├── No — enable it
│   ├── opcache.enable=1
│   ├── opcache.enable_cli=1
│   └── opcache.memory_consumption=256 (Laravel baseline)
│
├── Yes — verify configuration
│   ├── Is memory_consumption sufficient?
│   │   ├── Check: opcache_get_status()['memory_usage']['used_memory']
│   │   ├── If usage > 80% of memory_consumption: increase
│   │   └── Laravel baseline: 256MB (monitor and adjust)
│   │
│   ├── Is max_accelerated_files > total PHP file count?
│   │   ├── Find count: Get-ChildItem -Recurse -Filter *.php | Measure-Object
│   │   ├── Set to next power of 2 above count
│   │   └── Laravel baseline: 16384-20000
│   │
│   ├── Is interned_strings_buffer adequate?
│   │   └── Set to 32 (Laravel has many string constants)
│   │
│   └── Is use_cwd=0 set?
│       └── Improves cache hit consistency
│
└── (baseline configuration needed for production)
```

### Rationale
OpCache with insufficient memory or file capacity degrades performance below uncached levels due to cache thrashing. The baseline configuration (256MB memory, 20000 files, 32 interned strings) is appropriate for most Laravel applications. Monitor `opcache_get_status()` to verify hit ratio > 95%.

### Default Path
Enable OpCache with 256MB memory, 20000 max files, 32 interned strings buffer.

### Risks
- Default 64-128MB memory causes cache thrashing in Laravel
- max_accelerated_files below file count means some files are never cached
- Forgetting to set use_cwd=0 reduces cache hit rates

### Related Rules/Skills
- Enable OpCache with sufficient memory in production
- Set `max_accelerated_files` above your PHP file count
- Monitor OpCache hit ratio in production
- Skill: Configure OpCache for Laravel Production

---

## DT-K07-02: validate_timestamps Setting

### Decision Context
- **When to decide:** During PHP configuration for production vs development
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Configuring OpCache for the environment
- **Constraint:** validate_timestamps=0 eliminates stat() calls but requires explicit reset on deploy

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Environment type | High | Production = 0; Development = 1 |
| Deployment process | High | Must include worker restart or opcache_reset() |
| Performance requirement | Medium | stat() calls add overhead proportional to file count |

### Decision Tree

```
What environment is this?
├── Production
│   ├── Are PHP workers restarted on every deploy?
│   │   ├── Yes — set validate_timestamps=0 (maximum performance)
│   │   │   ├── opcache.validate_timestamps=0
│   │   │   ├── opcache.revalidate_freq=0
│   │   │   └── Zero filesystem stat() calls
│   │   │
│   │   └── No — cannot reliably reset OpCache after deploy
│   │       └── Must use validate_timestamps=1
│   │           ├── Set revalidate_freq to a reasonable interval (2-5s)
│   │           └── Accept periodic stat() overhead
│   │
│   └── (validate_timestamps=0 recommended for production)
│
├── Staging
│   └── validate_timestamps=1, revalidate_freq=2
│       └── Balances performance with code update visibility
│
└── Development
    └── validate_timestamps=1, revalidate_freq=0
        └── Code changes reflect immediately; accept stat() overhead
```

### Rationale
`validate_timestamps=0` eliminates the `stat()` system call on every included PHP file — this is the single biggest OpCache performance win. It requires that PHP workers are restarted after every deployment (or `opcache_reset()` is called). The combination of `validate_timestamps=0` without a deployment reset procedure causes stale code to serve indefinitely.

### Default Path
Set `validate_timestamps=0` in production and include worker restart (systemctl reload php-fpm or octane:reload) as the final deployment step.

### Risks
- validate_timestamps=0 without deploy-time reset = stale code continues serving
- validate_timestamps=1 with revalidate_freq causes periodic performance spikes
- opcache_reset() via deploy script requires opcache.enable_cli=1

### Related Rules/Skills
- Disable `validate_timestamps` in production
- Reset OpCache after every deployment
- Skill: Configure OpCache for Laravel Production

---

## DT-K07-03: Composer Autoloader Mode (-o vs -a)

### Decision Context
- **When to decide:** During production deployment configuration
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up composer install flags in deployment script
- **Constraint:** Authoritative mode (-a) crashes on any class not in the classmap

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Dynamic class generation | High | Factories, proxies, stubs break -a mode |
| Performance requirement | Medium | -a saves filesystem fallback, -o already gives O(1) classmap |
| Runtime environment | Medium | Octane benefits more from -a than FPM |

### Decision Tree

```
Does the application generate classes dynamically at runtime?
├── Yes — factories, Eloquent proxied classes, IDE helper stubs
│   └── Use optimized mode (-o)
│       ├── composer install --no-dev -o
│       └── Safe default with PSR-4 fallback
│
├── No — all classes known at build time
│   ├── Is this Octane?
│   │   ├── Yes — use authoritative mode (-a)
│   │   │   ├── composer install --no-dev -a
│   │   │   └── Stable class set per worker; maximum performance
│   │   │
│   │   └── No — standard FPM
│   │       ├── Performance-critical application?
│   │       │   ├── Yes — audit dynamic classes, then use -a
│   │       │   └── No — use -o (safe default)
│   │       │
│   │       └── (-o is sufficient for most applications)
│   │
│   └── (audit required before -a)
│
└── Unknown
    └── Use -o and audit for -a readiness
        ├── composer install --no-dev -o (safe)
        ├── Audit: Model factories, Eloquent proxies, IDE stubs
        ├── If none found, switch to -a
        └── If found, keep -o
```

### Rationale
Optimized mode (-o) provides O(1) classmap lookup with a PSR-4 fallback safety net — suitable for all applications. Authoritative mode (-a) skips the fallback entirely, providing slightly faster resolution but crashing on any dynamically generated class. Octane deployments benefit most from -a because the worker process has a stable class set per lifecycle.

### Default Path
Use `composer install --no-dev -o` for standard production deployments.

### Risks
- -a with dynamic class generation causes ClassNotFoundException in production
- Switching from -o to -a without audit may cause hard-to-detect failures
- -a in development breaks frequently as classes are added

### Related Rules/Skills
- Use `--optimize-autoloader` with composer install in production
- Use authoritative mode (-a) only when classmap is complete
- Skill: Configure OpCache for Laravel Production
