# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Configuration Management
**Generated:** 2026-06-03

---

# Decision Inventory

* `env()` vs `config()` Helper Usage
* Config Caching Strategy
* Config vs Database for Feature Flags

---

# Architecture-Level Decision Trees

---

## Decision 1: `env()` vs `config()` Helper Usage

---

## Decision Context

Laravel provides two helpers for reading configuration: `env()` (reads live environment) and `config()` (reads from cached config repository). Choosing incorrectly causes production-only bugs.

---

## Decision Criteria

* File location (config file vs application code)
* Whether `config:cache` is enabled in production
* Need for the value to reflect live environment changes
* Performance requirements

---

## Decision Tree

Where is the code located?
↓
Inside `config/*.php` file?
YES → Use `env('KEY', default)`
NO → Anywhere else (controllers, services, views, commands, jobs)?
    YES → Use `config('file.key', default)`
NO → Is `config:cache` run in production?
    YES → `env()` returns `null` after cache — must use `config()`
    NO → `env()` still works but is still wrong — use `config()`

---

## Rationale

After `php artisan config:cache`, `env()` calls in config files are resolved and frozen at cache time. `env()` calls in application code read from `$_ENV`, which returns `null` after caching because the environment file is no longer loaded. This creates inconsistency between development and production behavior.

---

## Recommended Default

**Default:** `env()` exclusively in `config/*.php` files; `config()` everywhere else
**Reason:** Config caching is a standard production optimization. Using `env()` outside config files silently breaks in production environments with caching enabled.

---

## Risks Of Wrong Choice

* `env()` in application code: Silent behavior changes between dev and production, debugging nightmares
* `config()` with incorrect key: Returns `null` instead of expected value, may silently fail

---

## Related Rules

* Use env() Only in Config Files (05-rules.md)
* Always Provide Default Values for env() Calls (05-rules.md)

---

## Related Skills

* Skill: Audit and Fix env() Misuse
* Skill: Implement Config Caching in Deployment Pipeline

---

## Decision 2: Config Caching Strategy

---

## Decision Context

When and how to implement config caching, balancing performance gains against operational complexity.

---

## Decision Criteria

* Environment (production vs development)
* Frequency of config changes
* Deployment script availability
* Need for live environment variable reading

---

## Decision Tree

What environment?
↓
Production?
YES → Is `config:cache` already part of deployment?
    YES → Verify `bootstrap/cache/config.php` exists and is current
    NO → Add `config:clear && config:cache` to deployment script
    NO → Does `config:cache` fail?
        YES → Check for `env()` calls in application code or unserializable values
        NO → Config is cached — verify after deployment
NO → Development or local?
    YES → Do NOT cache config — prevents changes from taking effect
    NO → Staging?
        YES → Cache config to match production behavior
        NO → Do not cache

---

## Rationale

Config caching reduces config loading from 3-8ms to <0.5ms, eliminates environment file reading, and freezes config values for consistency. However, it introduces operational complexity: cache must be rebuilt on every config change, and `env()` calls outside config files return `null` after caching.

---

## Recommended Default

**Default:** Always cache config in production; never cache in development
**Reason:** The performance benefit (order of magnitude reduction in config loading time) outweighs the operational cost of cache management. Development environments need live config updates.

---

## Risks Of Wrong Choice

* No caching in production: 3-8ms per request overhead, environment file read on every request
* Stale cache after deploy: Old config values serve requests (including old API keys, old database credentials)
* Caching in development: Config changes don't take effect, debugging confusion

---

## Related Rules

* Always Clear and Rebuild Config Cache on Deployment (05-rules.md)
* Run php artisan config:cache in Production (05-rules.md)
* Avoid Runtime Config Mutability (05-rules.md)

---

## Related Skills

* Skill: Implement Config Caching in Deployment Pipeline

---

## Decision 3: Config vs Database for Feature Flags

---

## Decision Context

Where to store feature flags and toggleable application settings: in config files (frozen at deploy time) or in database/cache (toggleable at runtime).

---

## Decision Criteria

* Frequency of toggling
* Deployment cycle length
* Whether the flag can be deployment-gated
* Need for instant rollback

---

## Decision Tree

How often does the feature flag need to change?
↓
Less than once per deployment cycle (deployment-gated)?
YES → Config file (`env('FEATURE_FLAG', false)`) is acceptable
NO → More than once per deployment cycle?
    YES → Config caching would freeze the value — use database or cache-backed flag system
NO → Is the flag used for emergency rollback?
    YES → Database or cache-backed flag (must toggle without deploy)
    NO → Is fine-grained user/group targeting needed?
        YES → Database-backed flag (per-user/per-group toggling)
        NO → Cache-backed flag (simple on/off toggling)

---

## Rationale

Config caching freezes configuration values at cache generation time. Changing a config-backed feature flag requires a full deployment (env change + config:cache). For flags that toggle between deployments, this coupling creates unnecessary overhead and delayed rollback capability.

---

## Recommended Default

**Default:** Config files for deployment-gated flags; database/cache for runtime-toggleable flags
**Reason:** The access pattern determines the storage mechanism. Config files are optimized for stable values that change with releases. Database/cache systems are optimized for values that change independently of releases.

---

## Risks Of Wrong Choice

* Config for runtime flags: Each toggle requires deployment, delayed rollback capability, coupling code releases to feature availability
* Database for deployment-gated flags: Unnecessary infrastructure complexity, slower access, no config caching benefit

---

## Related Rules

* Never Use Configuration for Runtime Feature Flags (05-rules.md)

---

## Related Skills

* Skill: Implement Config Caching in Deployment Pipeline
