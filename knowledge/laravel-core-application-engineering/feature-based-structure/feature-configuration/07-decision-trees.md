# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Dependencies
**Generated:** 2026-06-03

---

# Decision Inventory

* Per-Feature Config File vs Global config/services.php
* Feature-Prefixed Env Vars vs Shared Env Var Namespace
* Config Merging in Service Provider vs Direct Config Access

---

# Architecture-Level Decision Trees

---

## Decision 1: Per-Feature Config File vs Global config/services.php

---

## Decision Context

Whether to create a dedicated config file inside each feature directory or add feature configuration to the application's global config files.

---

## Decision Criteria

* Whether the feature has 3+ configurable values (API keys, endpoints, feature flags)
* Whether the configuration is feature-specific or truly application-wide
* Whether the feature is expected to be extracted into a package later
* Whether the team values co-location or centralized configuration

---

## Decision Tree

Does the feature have 3+ configuration values that are specific to that feature?
↓
NO → Add to existing global config file (e.g., `config/services.php`) — fewer files to manage
YES → Is the feature likely to be extracted into a separate package in the future?
    YES → Create per-feature config file — extraction is simpler with co-located config
    NO → Does the team prefer configuration co-located with feature code?
        YES → Create per-feature config file — `app/Features/Billing/config.php`
        NO → Is the configuration shared across 3+ features?
            YES → Keep in global config — shared values shouldn't be in a single feature's config
            NO → Create per-feature config file — co-location improves discoverability

---

## Rationale

Per-feature config files keep all feature settings in one place — no switching between `config/services.php`, `config/app.php`, and `config/feature.php` to configure a single feature. The tradeoff is more config files to manage. At 3+ feature-specific values, the co-location benefit outweighs the file proliferation cost.

---

## Recommended Default

**Default:** Per-feature `config.php` for features with 3+ configuration values. Global config files for values with 1-2 simple settings or shared across features.
**Reason:** The 3-value threshold ensures config file creation provides meaningful organization, not premature file creation.

---

## Risks Of Wrong Choice

* All config in global files: Billing config in `services.php`, `app.php`, `mail.php` — scattered and hard to find
* Per-feature config for 1 value: File overhead — `config.php` with one line is wasteful
* No consistent pattern: Some features have config files, others don't — confusing to developers

---

## Related Rules

* Use mergeConfigFrom() In Provider Boot Only
* Feature Configuration Namespace Convention

---

## Related Skills

* Create And Register Feature Configuration

---

---

## Decision 2: Feature-Prefixed Env Vars vs Shared Env Var Namespace

---

## Decision Context

Whether to prefix environment variables with the feature name (e.g., `BILLING_STRIPE_KEY`) or use a shared namespace (e.g., `STRIPE_KEY`).

---

## Decision Criteria

* Whether multiple features interact with the same external service (two features both using Stripe)
* Whether env var naming collisions are possible between features
* Whether the env vars are clearly owned by one feature or shared across the application
* Whether the team follows a convention for env var naming

---

## Decision Tree

Does the environment variable belong exclusively to one feature?
↓
YES → Could this env var name collide with another feature's requirement?
    YES → Use feature prefix — `BILLING_STRIPE_KEY`, `NOTIFICATIONS_SLACK_WEBHOOK`
    NO → Is the env var for an external service used by only this feature?
        YES → Use feature prefix — ownership is clear, no risk of accidental sharing
        NO → Use feature prefix — convention provides consistency
NO → Is the env var shared across 2+ features (database, Redis, app URL)?
    YES → Use application-level name — `DB_HOST`, `APP_URL`, `REDIS_HOST`
    NO → Use feature prefix — default convention

---

## Rationale

Feature-prefixed env vars (`BILLING_STRIPE_KEY`) prevent naming collisions and make ownership explicit. A developer seeing `BILLING_STRIPE_KEY` immediately knows it belongs to the Billing feature. Shared env vars (`DB_HOST`, `APP_URL`) remain unprefixed because they span the entire application.

---

## Recommended Default

**Default:** Prefix all feature-specific env vars with the feature name in SCREAMING_SNAKE_CASE. Keep application-wide env vars unprefixed.
**Reason:** Prefixing eliminates naming collisions and makes ownership explicit at a glance. Application-wide vars should not be prefixed because they aren't owned by any single feature.

---

## Risks Of Wrong Choice

* No prefix: `STRIPE_KEY` — which feature owns it? Collision if two features both use Stripe
* Prefix for shared vars: `APP_DB_HOST` is redundant — `DB_HOST` is universally understood
* Inconsistent prefixing: Some features prefix, others don't — developers can't predict env var names

---

## Related Rules

* Environment Variable Naming Convention
* Feature Configuration Namespace Convention

---

## Related Skills

* Create And Register Feature Configuration

---

---

## Decision 3: Config Merging in Service Provider vs Direct Config Access

---

## Decision Context

Whether to merge per-feature config files into Laravel's config repository via `mergeConfigFrom()` in the service provider or access config values directly from the feature's config file.

---

## Decision Criteria

* Whether the config values need to be accessible via `config('feature.key')` throughout the application
* Whether the config values should be cacheable with `php artisan config:cache`
* Whether the feature is toggled via provider registration (enabled/disabled by adding/removing the provider)
* Whether the config values need environment variable resolution (via `.env` references in config)

---

## Decision Tree

Does the config need to be accessible via `config('feature.key')` from anywhere in the application?
↓
YES → Use `mergeConfigFrom()` in the provider's `boot()` method — makes config globally available and cacheable
NO → Is `php artisan config:cache` used in deployment?
    YES → Use `mergeConfigFrom()` — config caching only works with merged config
    NO → Is the feature toggleable by registering/unregistering the provider?
        YES → Use `mergeConfigFrom()` — when the provider is removed, the config is also removed
        NO → Access config directly from the feature's config file — simpler, no merging needed

---

## Rationale

`mergeConfigFrom()` in the service provider's `boot()` method makes feature config available via `config()` and compatible with `php artisan config:cache`. Direct file access is simpler but doesn't participate in the config repository or caching. For features that are toggleable via provider registration, merging ensures config is available only when the feature is enabled.

---

## Recommended Default

**Default:** Use `mergeConfigFrom()` in the feature provider's `boot()` method for all feature configurations.
**Reason:** This makes config accessible via the standard `config()` helper, works with config caching, and automatically removes config when the feature provider is unregistered.

---

## Risks Of Wrong Choice

* Direct file access with config caching: Config values aren't cached — stale values after deployment
* `mergeConfigFrom()` in `register()`: Config access returns `null` — services configured with null values
* No merging at all: Feature must include its config file manually — inconsistent access pattern
* Merging for toggleable features without provider check: Config remains after feature is disabled

---

## Related Rules

* Use mergeConfigFrom() In Provider Boot Only
* Feature Configuration Namespace Convention

---

## Related Skills

* Create And Register Feature Configuration
