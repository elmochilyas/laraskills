# Decision Trees: OpCache Configuration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** OpCache Configuration
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-OC-01 | OpCache Memory and File Limit Sizing | Performance | Medium | Per server setup |
| DT-OC-02 | validate_timestamps Mode Selection | Performance | High | Per environment setup |
| DT-OC-03 | opcache.preload Enablement | Performance | High | Per infrastructure setup |

---

## DT-OC-01: OpCache Memory and File Limit Sizing

### Decision Context
- **When to decide:** During production server configuration
- **Stakeholders:** DevOps
- **Trigger:** Setting up PHP OpCache for a Laravel application
- **Constraint:** Insufficient memory causes cache eviction and thrashing

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| PHP file count | High | max_accelerated_files must exceed total file count |
| Memory budget | High | memory_consumption must hold all compiled files |
| Application growth | Medium | Account for future package additions |

### Decision Tree

```
Step 1: Determine total PHP file count
├── Count files: Get-ChildItem -Recurse -Include "*.php" | Measure-Object
├── Typical Laravel app: 5000-15000 files
│   ├── Small app (<5000 files) → max_accelerated_files=8000
│   ├── Medium app (5000-15000 files) → max_accelerated_files=20000
│   └── Large app (>15000 files) → next power of 2 above count
│
└── (set max_accelerated_files to a power of 2)

Step 2: Determine memory_consumption baseline
├── Start with 256MB
│   ├── Monitor with opcache_get_status()['memory_usage']['used_memory']
│   ├── If used_memory > 80% of memory_consumption → increase
│   └── If hit_ratio < 95% → increase
│
└── (monitor and adjust based on actual usage)

Step 3: Set other parameters
├── interned_strings_buffer = 32 (adequate for Laravel)
├── max_wasted_percentage = 10
└── use_cwd = 0 (improves cache hit consistency)
```

### Rationale
OpCache performance degrades sharply when limits are hit — files beyond `max_accelerated_files` are never cached, and running out of `memory_consumption` causes eviction. Baseline at 256MB/20000 files and monitor actual usage to tune.

### Default Path
Set `memory_consumption=256`, `max_accelerated_files=20000`, `interned_strings_buffer=32`.

### Risks
- Default 64-128MB memory causes cache thrashing, degrading performance below no-OpCache
- max_accelerated_files below file count means some files never cached, causing unpredictable latency
- Forgetting to monitor hit ratio: performance degrades silently

### Related Rules/Skills
- Allocate sufficient OpCache memory for Laravel
- Set `max_accelerated_files` above PHP file count
- Monitor OpCache hit ratio in production
- Skill: Configure OpCache for Laravel Production

---

## DT-OC-02: validate_timestamps Mode Selection

### Decision Context
- **When to decide:** During environment-specific PHP configuration
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Configuring OpCache for a specific environment
- **Constraint:** =0 gives max performance but requires deploy-time reset; =1 adds stat() overhead

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Environment | High | Production = 0; Development = 1 |
| Deployment process | High | Must include worker restart or opcache_reset() |
| Performance requirement | Medium | stat() calls add measurable overhead per request |

### Decision Tree

```
What environment is being configured?
├── Production
│   ├── Does the deployment process include worker restart?
│   │   ├── Yes — set validate_timestamps=0 (recommended)
│   │   │   ├── opcache.validate_timestamps=0
│   │   │   ├── opcache.revalidate_freq=0
│   │   │   ├── Zero filesystem interaction for cached files
│   │   │   └── Deployment: warm → restart workers
│   │   │
│   │   └── No — cannot reliably restart workers
│   │       └── Must use validate_timestamps=1
│   │           ├── opcache.validate_timestamps=1
│   │           ├── opcache.revalidate_freq=2
│   │           └── Accept periodic stat() overhead
│   │
│   └── (validate_timestamps=0 is strongly recommended)
│
├── Staging
│   ├── validate_timestamps=1
│   ├── revalidate_freq=2
│   └── Balance of performance and update visibility
│
└── Development
    ├── validate_timestamps=1
    ├── revalidate_freq=0
    └── Changes reflect immediately
```

### Rationale
`validate_timestamps=0` eliminates all filesystem `stat()` calls for cached PHP files, saving ~1 system call per included file per request. This is the highest-impact OpCache performance setting. It requires a deployment process that reliably resets OpCache (worker restart or `opcache_reset()`) after every code deployment.

### Default Path
Production: `validate_timestamps=0`. Development: `validate_timestamps=1`.

### Risks
- validate_timestamps=0 without deploy-time reset = stale code serves indefinitely
- validate_timestamps=1 with revalidate_freq causes periodic performance spikes
- opcache_reset() in deploy script requires opcache.enable_cli=1

### Related Rules/Skills
- Disable `validate_timestamps` in production
- Reset OpCache after every deployment
- Skill: Configure OpCache for Laravel Production

---

## DT-OC-03: opcache.preload Enablement

### Decision Context
- **When to decide:** During production infrastructure setup
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Configuring OpCache for Octane or high-performance FPM
- **Constraint:** Preloaded files cannot be invalidated without server restart

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Runtime environment | High | Octane benefits from preloading; FPM less so |
| File stability | High | Only preload files that never change between deployments |
| Performance requirement | Medium | Preloading reduces bootstrap by additional 20-40ms |

### Decision Tree

```
Is this an Octane deployment?
├── Yes — persistent worker process
│   ├── Preload stable framework files
│   │   ├── vendor/autoload.php
│   │   ├── laravel/framework/src/**/*.php
│   │   ├── vendor/symfony/**/*.php (popular packages)
│   │   └── DO NOT preload:
│   │       ├── app/ code (changes every deploy)
│   │       ├── config/ files (cached separately)
│   │       └── route/ files (cached separately)
│   │
│   └── (preloading significantly reduces worker start time)
│
├── No — standard PHP-FPM
│   ├── Preloading benefit is minimal
│   │   ├── FPM processes are short-lived
│   │   ├── OpCache already caches files after first request
│   │   └── Preload adds configuration complexity
│   │
│   └── Skip preloading for standard FPM deployments
│
└── (preload only stable, framework-level files)
```

### Rationale
Preloading eliminates file loading and compilation for preloaded classes entirely. For Octane (long-running workers), this provides a meaningful startup time reduction. For standard PHP-FPM, the benefit is limited because OpCache already works per-request — preloading only saves the compilation on the very first request.

### Default Path
Enable preloading for Octane (framework files only). Skip for standard PHP-FPM.

### Risks
- Preloading application code = requires server restart on every code change
- Preloading with incorrect permissions = PHP-FPM fails to start
- Preloading too many files = increased memory consumption with diminishing returns

### Related Rules/Skills
- Use `opcache.preload` only for stable framework files
- Skill: Configure OpCache for Laravel Production
