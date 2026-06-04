# Decision Trees: Octane Package Compatibility

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Octane Package Compatibility
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-PC-01 | Package Auditing Priority | Architecture | Medium | Per pre-Octane deployment |
| DT-PC-02 | Remediation Strategy (Shim vs Fork vs Disable) | Architecture | High | Per incompatible package |
| DT-PC-03 | Feature Gating for Partially Compatible Packages | Maintainability | Medium | Per partial compatibility |

---

## DT-PC-01: Package Auditing Priority

### Decision Context
- **When to decide:** Pre-Octane deployment or when adding new packages
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Enumerating packages for Octane compatibility audit
- **Constraint:** Transitive dependencies must also be audited

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Package usage frequency | High | Used on every request vs specific features |
| State leak risk | High | Singleton bindings, static properties, superglobals |
| Update frequency | Medium | Packages updated often need re-auditing |
| Known issues | Medium | Community-reported Octane issues |

### Decision Tree

```
Does the package register a service provider in config/app.php?
├── Yes — immediate audit required
│   ├── Check for singleton() bindings with mutable state
│   │   ├── Found → high priority (risk of cross-request data leak)
│   │   └── Not found → medium priority (check static properties)
│   │
│   ├── Check for static property assignments
│   │   ├── Found → high priority (accumulation over requests)
│   │   └── Not found → medium priority (check superglobal usage)
│   │
│   └── Check for $_SERVER/$_ENV/$_REQUEST access
│       └── Found → medium priority (static at worker start, but changes missed)
│           └── Verify superglobals don't change per-request in package usage
│
├── No — utility package (Facades, helpers, traits)
│   └── Check for:
│       ├── Static class properties that grow (arrays, caches)
│       ├── Global function state
│       └── register_shutdown_function() usage
│
└── Transitive dependency (dependency of another package)
    └── Same audit requirements as direct dependencies
        └── Run composer show --tree to discover
```

### Rationale
The highest risk packages are those that register singletons with mutable state — these can leak data between requests. Packages that use static properties for caching can accumulate memory. Packages that access `$_SERVER`/`$_ENV` directly may miss environment changes or use stale values.

### Default Path
Audit all packages with service providers first, then utility packages, then transitive dependencies.

### Risks
- Missing transitive dependencies — the leak is in a package's dependency, not the package itself
- Assuming a package is safe because it has no service provider — static properties can still leak
- Not re-auditing after minor updates — patch versions can introduce new singletons

### Related Rules/Skills
- Audit every installed package for Octane compatibility before deployment
- Skill: Evaluate and Remediate Third-Party Package Octane Compatibility

---

## DT-PC-02: Remediation Strategy (Shim vs Fork vs Disable)

### Decision Context
- **When to decide:** After identifying an incompatible package
- **Stakeholders:** Backend Developers
- **Trigger:** Package classified as incompatible or partially compatible
- **Constraint:** Shim is upgrade-safe; fork is maintenance-heavy

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Remediation effort | High | Shim is easier than fork or disable |
| Upgrade path | High | Shim survives updates; fork requires manual merging |
| Feature criticality | High | Can the feature be disabled or replaced? |

### Decision Tree

```
Can the package's incompatibility be fixed with a RequestTerminated listener?
├── Yes — the issue is accumulating static state that can be reset
│   └── Create shim: RequestTerminated listener
│       ├── Example: Spatie Permission — forgetCachedPermissions()
│       ├── Survives composer update
│       └── Minimal maintenance
│
├── No — the issue is singleton binding with mutable state
│   ├── Can the binding be overridden as scoped?
│   │   ├── Yes — create scoped override in AppServiceProvider
│   │   │   ├── $this->app->scoped(PackageService::class, ...)
│   │   │   └── Overrides the package's singleton registration
│   │   │
│   │   └── No — package hardcodes singleton
│   │       └── Can the package be upgraded to a compatible version?
│   │           ├── Yes — upgrade and re-test
│   │           └── No → evaluate fork or disable
│   │
│   └── (scoped override is upgrade-safe; fork is last resort)
│
└── Neither approach works
    ├── Is the package critical for the application?
    │   ├── Yes — consider fork with upstream PR
    │   │   └── Maintenance burden: manual merging of upstream changes
    │   │
    │   └── No — disable or replace the package
    │       └── Find Octane-compatible alternative
    │
    └── (shim > scoped override > fork > disable)
```

### Rationale
Shims (RequestTerminated listeners) are the safest remediation — they survive `composer update` and require no package code changes. Scoped overrides are next safest. Forks require manual merging of every upstream change, creating ongoing maintenance burden. Disabling or replacing packages should be considered before forking.

### Default Path
Shim with RequestTerminated listener. If that's insufficient, use scoped override. Fork only as last resort.

### Risks
- Fork missing security patches — stale codebase with vulnerabilities
- Scoped override may break if package internals change in update
- Shim may not reset all state — partial cleanup leaves residual accumulation

### Related Rules/Skills
- Create shim layers over package forks
- Skill: Evaluate and Remediate Third-Party Package Octane Compatibility

---

## DT-PC-03: Feature Gating for Partially Compatible Packages

### Decision Context
- **When to decide:** When a package has some compatible and some incompatible features
- **Stakeholders:** Backend Developers
- **Trigger:** Package classified as partially compatible
- **Constraint:** Must not block critical features while enabling safe ones

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Feature isolation | High | Can incompatible features be separated from compatible ones? |
| Usage frequency of incompatible features | Medium | Used on every request vs rarely? |
| Gating mechanism | Medium | Conditional registration vs separate provider |

### Decision Tree

```
Can the incompatible features be isolated from the rest of the package?
├── Yes — incompatible functions are separate from core functionality
│   ├── Are the incompatible features critical?
│   │   ├── Yes — disable only in Octane, keep in PHP-FPM
│   │   │   └── Gate with: if (! app()->bound(Octane::class)) { enableFeature(); }
│   │   │
│   │   └── No — disable entirely
│   │       └── Remove feature registration from service provider
│   │
│   └── (gate incompatible features only)
│
├── No — package is a monolith where all features share state
│   └── Full package must be treated as compatible or incompatible
│       ├── If the core is compatible, use shim for state cleanup
│       └── If the core is incompatible, replace the entire package
│
└── (partial compatibility requires careful feature isolation)
```

### Rationale
Some packages have features that work perfectly under Octane and others that break. Feature-flag gating allows teams to keep safe features active while disabling or replacing incompatible ones. The gate check `app()->bound(Octane::class)` is non-invasive and survives package updates.

### Default Path
Gate incompatible features behind `if (! app()->bound(Octane::class))` check.

### Risks
- Gating logic may not be cleanly separable — feature interdependencies may require more invasive changes
- New package versions may change feature boundaries — re-audit required
- Gate check may not be available early enough in boot sequence for some features

### Related Rules/Skills
- Use feature-flag gating for partially compatible packages
- Skill: Evaluate and Remediate Third-Party Package Octane Compatibility
