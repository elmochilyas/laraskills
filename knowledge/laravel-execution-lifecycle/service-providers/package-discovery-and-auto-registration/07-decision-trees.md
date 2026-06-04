# Decision Trees — Package Discovery and Auto-Registration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Package Discovery and Auto-Registration |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Auto-Discovery vs Manual Registration | Whether to rely on package auto-discovery or manually register a package's providers | Every new package | Medium |
| D02 | Exclude via `dont-discover` vs Trust Discovery | Whether to exclude a package from discovery and handle it manually | Package configuration | High |
| D03 | Stale Cache Diagnosis | What steps to take when a package's provider is not loading after installation | Troubleshooting | Medium |
| D04 | Duplicate Registration Detection | Whether a provider is already registered through discovery before manually adding it | Every provider addition | Medium |

---

## D01: Auto-Discovery vs Manual Registration

### Decision Context
You are installing a new package that declares providers via `extra.laravel.providers`. You must decide whether to let auto-discovery handle registration or disable discovery and register manually.

### Criteria
1. **Audit requirements**: Does your application require an explicit provider dependency graph?
2. **Ordering needs**: Does this provider need to appear at a specific position in the registration order?
3. **Environmental control**: Do you need environment-specific registration for this provider?
4. **Duplicate risk**: Is there potential for this provider to also be manually listed?

### Decision Tree
```
New package with auto-discovered providers
├── Does your application require explicit provider dependency visibility?
│   ├── Yes → Use dont-discover + manual registration in bootstrap/providers.php
│   └── No → Does the provider need to appear at a specific position in registration order?
│       ├── Yes → Use dont-discover + manual registration (discovered providers always append)
│       └── No → Do you need environment-specific registration for this provider?
│           ├── Yes → Use dont-discover + conditional manual registration in proxy provider
│           └── No → Rely on auto-discovery (simpler, no extra config)
```

### Rationale
Auto-discovery is the default for convenience — it requires no configuration and works transparently. However, discovered providers always append after manual providers, which may not suit applications requiring precise provider ordering. For enterprise/audit-heavy applications, explicit manual registration provides visibility into the provider graph. For environment-specific registration, discovery cannot be conditional — manual registration is required.

### Default
Rely on auto-discovery unless you need ordering control, environment-specific registration, or explicit dependency visibility.

### Risks
- Manually adding a discovered provider = duplicate registration.
- Stale cache after package add/remove = provider not loading or fatal errors.
- Discovery opacity = unknown providers registered without explicit approval.

### Related Rules/Skills
- Skill: Configure Package Discovery for a New Package

---

## D02: Exclude via `dont-discover` vs Trust Discovery

### Decision Context
You have a package that you do not want to be auto-discovered. Should you exclude it via `dont-discover` or take other measures?

### Criteria
1. **Environment targeting**: Does the package need to run only in specific environments?
2. **Replacement**: Are you replacing the package's provider with a custom one?
3. **Security/compliance**: Does the package introduce security concerns that require explicit oversight?
4. **Usage**: Do you still need the package's services in some environments?

### Decision Tree
```
Package that should not be auto-discovered
├── Is this a development-only package (Debugbar, Telescope, IDE helpers)?
│   ├── Yes → Add to extra.laravel.dont-discover in root composer.json
│   │   └── Then → Conditionally register in a proxy provider for non-production environments
│   └── No → Are you replacing the package's provider with a custom implementation?
│       ├── Yes → Add to dont-discover (prevent the original from loading)
│       └── No → Is the package a security/compliance concern?
│           ├── Yes → Use dont-discover + manual registration with security review
│           └── No → Do you simply want explicit control?
│               ├── Yes → Use dont-discover + manual registration
│               └── No → Trust discovery
```

### Rationale
`dont-discover` is the cleanest way to prevent a package's providers from auto-registering. For development-only packages, this prevents them from loading in production at all. For other packages, it gives you explicit control over registration timing and ordering. The alternative — letting discovery register the provider and then modifying behavior — is more fragile.

### Default
Use `dont-discover` for development-only packages. Trust discovery for production packages with no special requirements.

### Risks
- Forgetting to manually register after `dont-discover` = provider never loads.
- `dont-discover` list growing stale with unused entries.
- Wildcard patterns not supported — only exact package names.

### Related Rules/Skills
- Rule 3: Use `dont-discover` for Development Packages, Then Conditionally Register
- Skill: Conditionally Register Environment-Specific Providers

---

## D03: Stale Cache Diagnosis

### Decision Context
You installed a package (or removed one), but its provider is not loading (or a removed package's provider is still causing errors).

### Criteria
1. **Operation performed**: Was a package added or removed?
2. **Cache state**: Is `bootstrap/cache/packages.php` current?
3. **Manual registration**: Is the provider also manually listed in `bootstrap/providers.php`?
4. **Deferral status**: Does the provider implement `DeferrableProvider`?

### Decision Tree
```
Provider not loading or stale provider causing errors
├── Was a package just added but provider doesn't load?
│   ├── → Run php artisan optimize:clear (clears all bootstrap caches)
│   ├── → Check bootstrap/cache/packages.php — does it contain the provider?
│   │   ├── Yes → Check dont-discover list — is the package excluded?
│   │   └── No → Run composer dump-autoload to regenerate packages.php
│   └── → On next request, provider should load
├── Was a package removed but its provider is still causing errors?
│   ├── → Delete bootstrap/cache/packages.php (or run optimize:clear)
│   ├── → Check bootstrap/providers.php for manual reference to deleted provider
│   └── → Check bootstrap/cache/services.php (deferred provider manifest)
└── Was a package updated but provider behavior hasn't changed?
    ├── → Check bootstrap/cache/packages.php modification time vs vendor package
    └── → Run composer dump-autoload to regenerate
```

### Rationale
The package discovery cache (`bootstrap/cache/packages.php`) is generated during `composer dump-autoload` (triggered by `composer install/update`). If the cache is stale, the provider list in memory doesn't match the filesystem. This is the most common cause of "provider not found" after package changes. The fix is always to regenerate the cache.

### Default
When in doubt, run `php artisan optimize:clear` to rebuild all bootstrap caches.

### Risks
- Manually editing `bootstrap/cache/packages.php` = changes overwritten on next discovery.
- Not clearing cache in CI/CD deployment = stale provider list in production.
- Modifying `bootstrap/providers.php` without clearing cache = missed updates.

### Related Rules/Skills
- Skill: Diagnose and Fix Deferred Manifest Issues

---

## D04: Duplicate Registration Detection

### Decision Context
You are about to add a provider to `bootstrap/providers.php`. You need to determine whether it is already registered via auto-discovery to avoid duplicate registration.

### Criteria
1. **Package discovery**: Is the provider declared in any installed package's `extra.laravel.providers`?
2. **Cache state**: Is `bootstrap/cache/packages.php` current?
3. **Existing manual list**: Is the provider already in `bootstrap/providers.php`?

### Decision Tree
```
About to add provider to bootstrap/providers.php
├── Is this a first-party application provider (App\Providers\*)?
│   ├── Yes → Add normally (application providers are not auto-discovered)
│   └── No → Is this a third-party package provider?
│       ├── Yes → Check bootstrap/cache/packages.php — is it already listed?
│       │   ├── Yes → DO NOT add manually — provider already registers via discovery
│       │   │   └── If you need ordering control → Use dont-discover + manual registration
│       │   └── No → Is the package in extra.laravel.dont-discover?
│       │       ├── Yes → Was it manually registered before? → Check bootstrap/providers.php
│       │       └── No → Package may not define providers — add manually
│       └── Result: Never manually register a provider that is already auto-discovered
```

### Rationale
Manually adding an auto-discovered provider creates duplicate registration: the provider's `register()` and `boot()` run twice. This can cause duplicate binding exceptions, duplicate route registrations (404 errors), duplicate event listeners firing twice, and memory overhead from double instantiation. The package discovery cache (`bootstrap/cache/packages.php`) is the definitive source for which providers are auto-registered.

### Default
Check `bootstrap/cache/packages.php` before manually registering any third-party provider.

### Risks
- Duplicate binding: `Cannot override existing binding` exceptions.
- Duplicate routes: route registration 404 errors.
- Duplicate listeners: event listeners firing twice.
- Memory overhead: provider instantiated twice.

### Related Rules/Skills
- Skill: Configure Package Discovery for a New Package
