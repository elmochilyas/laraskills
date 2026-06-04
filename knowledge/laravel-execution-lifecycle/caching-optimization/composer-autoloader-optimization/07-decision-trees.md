# Decision Trees: Composer Autoloader Optimization

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Composer Autoloader Optimization
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-AU-01 | Optimized (-o) vs Authoritative (-a) Autoloading | Performance | Medium | Per deployment strategy |
| DT-AU-02 | APCu Autoloader Enablement | Performance | Medium | Per infrastructure setup |
| DT-AU-03 | Autoloader Regeneration Timing | Maintainability | Low | Per composer change |

---

## DT-AU-01: Optimized (-o) vs Authoritative (-a) Autoloading

### Decision Context
- **When to decide:** During production deployment configuration
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Setting up production deployment script for a Laravel application
- **Constraint:** Autoloader must resolve all classes without ClassNotFoundException at runtime

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Dynamic class generation | High | Factories, proxies, stubs need PSR-4 fallback |
| Performance requirement | Medium | -a saves filesystem fallback; -o already gives O(1) classmap |
| Runtime environment | Medium | Octane worker lifecycle vs per-request execution |
| Deployment stability | High | -a crashes on any missing class; -o falls back gracefully |

### Decision Tree

```
Does the application generate classes dynamically at runtime?
├── Yes — factories, Eloquent models, proxies, IDE helper stubs
│   └── Use optimized mode (-o) — safe, preserves PSR-4 fallback
│       ├── composer install --no-dev -o
│       └── Classmap used first, PSR-4 fallback for dynamic classes
│
├── No — all classes are known at build time
│   ├── Is this an Octane deployment?
│   │   ├── Yes
│   │   │   └── Use authoritative mode (-a) for maximum performance
│   │   │       ├── composer install --no-dev -a
│   │   │       └── No filesystem checks; stable class set per worker
│   │   │
│   │   └── No — standard PHP-FPM
│   │       ├── Performance requirement is extreme?
│   │       │   ├── Yes — audit for dynamic classes, then use -a
│   │       │   └── No — use -o (safe default)
│   │       │       └── composer install --no-dev -o
│   │       │
│   │       └── (default path)
│   │
│   └── (audit required before -a)
│
└── Unknown — codebase has potential dynamic class generation
    └── Use -o and audit for -a readiness
        ├── composer install --no-dev -o (safe)
        ├── Audit codebase for: Model factories, Eloquent proxied classes,
        │   IDE helper stubs, generated test classes
        ├── If none found, switch to -a
        └── If found, keep -o
```

### Rationale
Optimized mode (-o) is the safe default for most applications — it provides the O(1) classmap lookup with a PSR-4 fallback safety net. Authoritative mode (-a) skips filesystem checks entirely, which makes it faster but crashes on any class not in the classmap. Octane deployments benefit most from -a because the worker process has a stable class set per lifecycle.

### Default Path
Use `composer install --no-dev -o` for standard production deployments.

### Risks
- -a with dynamic class generation causes ClassNotFoundException in production
- Switching from -o to -a without audit may cause hard-to-detect failures
- -a in development breaks frequently as classes are added

### Related Rules/Skills
- Use optimized autoloader in every production deployment
- Use authoritative mode (-a) only when classmap is complete
- Do not use authoritative mode in development
- Skill: Optimize Composer Autoloader for Production

---

## DT-AU-02: APCu Autoloader Enablement

### Decision Context
- **When to decide:** During production server configuration or Octane deployment
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Evaluating performance optimizations for high-throughput applications
- **Constraint:** APCu PHP extension must be installed and enabled

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| APCu availability | High | Extension must be installed and CLI-enabled for CLI usage |
| Throughput requirement | Medium | High-throughput apps benefit most from ~0.5ms savings |
| Deployment complexity | Low | Config change in composer.json + extension installation |

### Decision Tree

```
Is the APCu PHP extension available?
├── Yes, APCu is installed
│   ├── Is this a high-throughput application (>1000 req/s)?
│   │   ├── Yes
│   │   │   └── Enable APCu autoloader
│   │   │       ├── Add to composer.json: "config": { "apcu-autoloader": true }
│   │   │       ├── For CLI: set apc.enable_cli=1 in php.ini
│   │   │       └── For Octane: recommended; workers load classmap once
│   │   │
│   │   └── No — standard traffic volume
│   │       ├── Is this Octane?
│   │       │   ├── Yes — enable APCu (benefit is meaningful per worker)
│   │       │   └── No — benefit is marginal (~0.5ms per request)
│   │       │       └── Optional; not a priority optimization
│   │       │
│   │       └── (weigh cost vs benefit)
│   │
│   └── (skip if marginal benefit)
│
└── No, APCu is not installed
    └── Do not use APCu autoloader
        ├── Priority: install OpCache first (higher impact)
        ├── APCu installation requires PHP extension
        └── Without APCu, classmap is loaded from file (still optimized)
```

### Rationale
APCu autoloader stores the classmap in shared memory, saving ~0.5ms of file reading on first class resolution. This is valuable for Octane (classmap stored once per worker start) and high-throughput applications where every microsecond counts. For standard applications with OpCache already caching the autoloader file, the marginal gain is minimal.

### Default Path
Do not use APCu autoloader unless APCu is already installed and the application is Octane or high-throughput.

### Risks
- APCu classmap is shared across all PHP processes — must be consistent across deployments
- APCu memory allocation must be sized correctly; default may be too small
- APCu autoloader adds configuration complexity for marginal gain on low-traffic apps

### Related Rules/Skills
- Combine optimized autoloader with OpCache
- Consider APCu autoloader for high-throughput applications

---

## DT-AU-03: Autoloader Regeneration Timing

### Decision Context
- **When to decide:** During development workflow and deployment pipeline design
- **Stakeholders:** Backend Developers
- **Trigger:** Any change to composer dependencies, autoload configuration, or class files
- **Constraint:** Classmap is a snapshot — must be regenerated when classes change

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Type of change | High | composer require/update vs manual class addition |
| Environment | High | Development vs production regeneration frequency |
| Autoloader mode | Medium | -o mode has PSR-4 fallback; -a requires regeneration on every class |

### Decision Tree

```
What type of change was made?
├── composer require or composer update
│   └── Always regenerate autoloader
│       ├── composer dump-autoload -o (production)
│       └── composer dump-autoload (development — no optimization needed)
│
├── New class file added to existing namespace
│   ├── Optimized mode (-o)
│   │   ├── Class will be found via PSR-4 fallback
│   │   └── Regeneration is not urgent but recommended before deployment
│   │
│   └── Authoritative mode (-a)
│       └── MUST regenerate immediately
│           └── ClassNotFoundException otherwise
│
├── composer.json autoload section modified
│   └── Always regenerate: composer dump-autoload -o
│
└── Deployment
    └── Always regenerate as part of deployment script
        ├── composer install --no-dev -o (handles regeneration)
        └── Or composer dump-autoload -o after install
```

### Rationale
In optimized mode (-o), new classes in existing namespaces are found via PSR-4 fallback even without regeneration, making it safe to defer regeneration to the next deployment. In authoritative mode (-a), regeneration is required immediately for any class addition because there is no PSR-4 fallback. Composer changes always require regeneration because the classmap is rebuilt from the current autoload configuration.

### Default Path
Regenerate autoloader as part of every deployment via `composer install --no-dev -o`.

### Risks
- Missing regeneration after composer update = ClassNotFoundException for new package classes
- Authoritative mode without regeneration after class addition = broken deployment
- Manual classmap edits are overwritten on next dump-autoload

### Related Rules/Skills
- Regenerate autoloader after every composer change
- Use optimized autoloader in every production deployment
