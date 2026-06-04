# Decision Trees — Environment-Specific Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Environment-Specific Providers |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Compile-Time Exclusion vs Runtime Guard | Whether to exclude the provider entirely or use a runtime environment check | Every environment-specific provider | High |
| D02 | Environment String vs Config-Driven Guard | Whether to use `$app->environment('local')` or `config('app.debug')` for the guard | Every conditional registration | Medium |
| D03 | dont-discover vs Manual Exclusion | How to exclude an auto-discovered development package from production | Package configuration | High |
| D04 | Proxy Provider vs Inline Conditional Registration | Where to place the conditional registration logic | Architecture decision | Medium |

---

## D01: Compile-Time Exclusion vs Runtime Guard

### Decision Context
You need to ensure a provider only runs in specific environments. You can either guard the registration (compile-time exclusion — provider never instantiated) or add an environment check inside the provider itself (runtime guard — provider still instantiated).

### Criteria
1. **Performance impact**: How heavy is the provider's class loading and instantiation cost?
2. **Provider ownership**: Can you modify the provider's source code?
3. **Registration location**: Is the provider auto-discovered, manually listed, or conditionally registered?
4. **Multiple bindings**: Does the provider register some bindings needed in all environments and some only in specific ones?

### Decision Tree
```
Environment-specific provider
├── Can you control where the provider is registered (not auto-discovered)?
│   ├── Yes → Use compile-time exclusion: conditional $app->register() in proxy provider
│   │   ├── Provider instantiation cost is significant (>0.1ms)?
│   │   │   ├── Yes → Strongly prefer compile-time exclusion
│   │   │   └── No → Compile-time exclusion still preferred (zero cost)
│   │   └── Result: Provider never instantiated in excluded environments
│   └── No (auto-discovered) → Use dont-discover + conditional manual registration
│       └── Result: Compile-time exclusion via dont-discover
├── (Alternative) Can you modify the provider's source code?
│   ├── Yes → Add runtime guard inside register()/boot()
│   │   └── Result: Provider still instantiated; code checks environment
│   └── No → Provider runs unconditionally — MUST use compile-time exclusion at registration
```

### Rationale
Compile-time exclusion prevents the provider from ever being loaded, instantiated, or executed in non-target environments. This saves PHP class autoloading, constructor execution, memory allocation, and both `register()` and `boot()` overhead. Runtime guards save `boot()` work but still pay the instantiation and `register()` costs. The difference is significant for heavy providers (5-15ms for Debugbar).

### Default
Always prefer compile-time exclusion via conditional `$app->register()` in a proxy provider. Only use runtime guards when the provider cannot be conditionally registered and you control its source.

### Risks
- Runtime-guarded providers still instantiate in production, wasting resources.
- Compile-time exclusion requires a proxy provider and adds indirection.
- Auto-discovered packages need `dont-discover` for compile-time exclusion.

### Related Rules/Skills
- Rule 1: Prefer Compile-Time Exclusion Over Runtime Guards
- Skill: Conditionally Register Environment-Specific Providers

---

## D02: Environment String vs Config-Driven Guard

### Decision Context
When writing the conditional registration guard, you must choose between an environment string check (`$this->app->environment('local')`) and a config-driven check (`config('app.debug')`).

### Criteria
1. **Flexibility**: Will this condition ever need to change without a code deploy?
2. **Semantic match**: Does the condition map exactly to an environment name?
3. **Config caching**: Is `php artisan config:cache` in use? (Locks config values.)
4. **Multiple environments**: Are there multiple environments where the provider should run?

### Decision Tree
```
Conditional guard for provider registration
├── Will this condition ever change without code changes?
│   ├── Yes → Use config-driven guard (config('app.debug') or custom config)
│   └── No → Does the condition map exactly to APP_ENV values?
│       ├── Yes → Use environment string guard ($this->app->environment('local'))
│       └── No → Does it apply to multiple environments?
│           ├── Yes → Use config-driven guard (more flexible)
│           └── No → Single environment → either approach works
├── Is config cache in use and the config value might differ between build and runtime?
│   ├── Yes → Use environment string (config is locked at cache time)
│   └── No → Either approach works
```

### Rationale
Environment strings (`'local'`, `'production'`) are simple and direct but hard-code environment names into code. Config-driven checks (`config('app.debug')`) decouple the decision from environment naming, allowing toggling via `.env` files without code changes. However, config caching locks values at cache-build time, so runtime `.env` changes don't take effect until cache is rebuilt.

### Default
Prefer config-driven guards for flexibility. Use environment strings when the decision must exactly follow `APP_ENV` and config caching is used.

### Risks
- Environment strings require code changes to add new environments.
- Config-driven guards produce unexpected behavior if config cache is stale.
- Mixing both approaches inconsistently across providers creates confusion.

### Related Rules/Skills
- Rule 2: Use Config-Driven Guards Over Hard-Coded Environment Strings
- Skill: Conditionally Register Environment-Specific Providers

---

## D03: dont-discover vs Manual Exclusion

### Decision Context
A development-only package is auto-discovered by Laravel's package discovery mechanism. You need to prevent it from registering in production.

### Criteria
1. **Auto-discovery**: Is the package listed in `vendor/composer/installed.json` with a `providers` entry?
2. **Package origin**: Is this a third-party package you cannot modify?
3. **Conditional registration**: Do you want to register it in some environments?
4. **Selective exclusion**: Do you want to exclude only specific providers from the package?

### Decision Tree
```
Development package auto-discovered
├── Do you want to exclude the entire package's providers?
│   ├── Yes → Add package name to extra.laravel.dont-discover in root composer.json
│   │   └── Then → Manually register the provider conditionally in a proxy provider
│   └── No → Do you want to exclude only specific providers from the package?
│       ├── Yes → Add individual provider class to dont-discover
│       └── No → Keep auto-discovery (provider runs in all environments)
├── After excluding, do you still need the provider in non-production environments?
│   ├── Yes → Register conditionally: $app->register(Provider::class) guarded by env/config
│   └── No → Exclude permanently via dont-discover; no manual registration needed
```

### Rationale
Auto-discovered packages are always registered regardless of environment. The most reliable way to exclude them from production is to disable auto-discovery via `dont-discover` in `composer.json`, then manually register them in a conditional proxy provider. This gives you compile-time exclusion in production and explicit control over where the provider loads.

### Default
Exclude development packages via `dont-discover` and conditionally register them manually.

### Risks
- Forgetting to manually register after `dont-discover` = provider never loads anywhere.
- Excluding via `dont-discover` in `composer.json` but not updating on composer install/update.
- The `dont-discover` array grows unmaintained over time.

### Related Rules/Skills
- Rule 3: Use `dont-discover` for Development Packages, Then Conditionally Register
- Skill: Conditionally Register Environment-Specific Providers

---

## D04: Proxy Provider vs Inline Conditional Registration

### Decision Context
You need to conditionally register environment-specific providers. Should you create a dedicated proxy provider for this purpose or add the conditional registration to an existing provider like `AppServiceProvider`?

### Criteria
1. **Number of conditional registrations**: How many providers are being conditionally registered?
2. **Domain separation**: Does the conditional logic belong in a specific domain or is it cross-cutting?
3. **Existing provider size**: How large is the existing provider you'd add the logic to?
4. **Clarity**: Will a separate provider make the architecture clearer?

### Decision Tree
```
Conditional registration needed
├── Is there one existing provider (e.g., AppServiceProvider) already handling similar concerns?
│   ├── Yes → Add to existing provider (fewer classes)
│   └── No → Fewer than 3 conditional registrations?
│       ├── Yes → Add to an existing domain provider
│       └── No → Create a dedicated proxy provider (e.g., EnvironmentServiceProvider)
├── Would the existing provider exceed 100 lines if you add this logic?
│   ├── Yes → Create separate proxy provider
│   └── No → Adding to existing is fine
```

### Rationale
Proxy providers isolate environment-specific registration logic in a single place, making it easy to audit which providers run in which environments. For simple cases (1-2 conditional registrations), adding to an existing provider avoids unnecessary classes. For complex cases, a dedicated proxy provider provides clarity and auditability.

### Default
Use a proxy provider (`EnvironmentServiceProvider`) for 3+ conditional registrations. Add to an existing provider for 1-2.

### Risks
- Too many proxy providers = confusing indirection.
- No proxy provider = conditional logic scattered across multiple providers, hard to audit.
- Proxy provider itself must be eager (cannot defer environment-specific registration).

### Related Rules/Skills
- Rule 4: Audit Production Provider List to Exclude Development Providers
- Skill: Conditionally Register Environment-Specific Providers
