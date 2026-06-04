# Laravel Pennant

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** feature-flag-governance
- **Knowledge Unit:** Laravel Pennant
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Pennant is Laravel's first-party feature flag package (introduced in Laravel 11), providing a simple but powerful interface for managing feature flags with support for database and array drivers, customizable resolution scopes, and native framework integration. It enables safe, gradual feature releases without external dependencies.

---

## Core Concepts

- **Feature definition** via a dedicated class or closure that determines flag resolution logic
- **Resolution scope** — flags can be resolved per user, per session, or globally
- **Database driver** persists flag states across requests and server instances
- **Array driver** uses in-memory configuration for simple or static flags
- **Blade directive** (`@feature`) for template-level feature checks
- **Artisan commands** (`pennant:feature`, `pennant:publish`) for flag management
- **Middleware** (`EnsureFeatureIsActive`) for route-level feature gating

---

## Mental Models

- **The Application Configuration:** Pennant extends the concept of configuration to runtime — flags are configuration values that change without deploying code.
- **The Permission for Features:** Like authorization gates but for features — `Feature::active('new-checkout')` checks if the current scope has the feature enabled.
- **The Experiment Switchboard:** A simple switchboard connecting features to their target audiences — user ID, team, random bucket, or custom scope.

---

## Internal Mechanics

Features are defined as classes implementing `Feature` interface or closures in `AppServiceProvider`. Each feature's `resolve()` method receives a scope (user, session, or null) and returns boolean. The database driver stores flag states in a `features` table with columns for feature name, scope type, scope ID, and value. When `Feature::active()` is called, Pennant checks the database for a stored value, falling back to the feature's `resolve()` method if none exists. The array driver reads from config, useful for testing. Pennant supports pipeline hooks (`afterResolving`) for custom resolution logic.

---

## Patterns

**User-Scoped Feature Pattern:** Resolve feature per user — different users see different feature states. Benefit: Personalized rollouts, gradual user migration. Tradeoff: Storage scales with number of users with explicit assignments.

**Session-Scoped Feature Pattern:** Resolve feature per session (random bucket). Benefit: Consistent experience within a session without user storage. Tradeoff: Same user may see different flags across sessions.

**Global Feature Pattern:** Feature is on or off for all users. Benefit: Simple kill switch, no scope management. Tradeoff: Cannot target specific users.

---

## Architectural Decisions

Use Pennant for most Laravel feature flag needs — it's first-party, simple, and integrates with existing Laravel patterns. Use the database driver for persistent flags that survive deployments. Use the array driver for flags that are environment-specific (enabled in staging, disabled in production). Prefer feature classes over closures for complex resolution logic to keep service providers clean. Use the `@feature` Blade directive for UI toggles and `EnsureFeatureIsActive` middleware for route protection.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| First-party, no external dependencies | Limited to simple flag logic | Complex targeting (A/B tests, percentage rollouts) needs custom resolution |
| Native Laravel integration | Database driver requires migration | Additional table for flag storage |
| Support for multiple resolution scopes | Scope management complexity | User-scoped flags need user context in all feature checks |
| Blade and middleware support | No built-in admin UI | Requires custom dashboard for flag management |

---

## Performance Considerations

Database driver queries the `features` table for each flag resolution — cache resolved values per request. Index the `features` table on `feature`, `scope_type`, `scope_id` for efficient lookups. For high-traffic applications, use the array driver with environment-based flags to avoid database queries on every request. Feature class resolution is resolved via the container — keep resolve methods lightweight. Avoid resolving features in tight loops — resolve once and reuse.

---

## Production Considerations

Define features in source control alongside application code. Use environment variables to control default states across environments. Implement a simple admin panel or Artisan command for managing feature flags in production. Create cleanup tickets for removing features after full rollout. Monitor feature usage — flags that are always on or always off should be removed. Test feature resolution with user scenarios in CI. Document feature flags for team awareness.

---

## Common Mistakes

**Not caching feature resolution results** — database queries on every request for the same feature. Cache per request or use a short-lived cache.

**Over-relying on environment-based flags** — environment flags require deployment to change. Use database-driven flags for production toggles.

**Creating too many user-scoped flags** — each flag stores a row per user with explicit assignment. Use session-scoping or percentage-based custom resolution for large user bases.

---

## Failure Modes

- **Database connection failure for feature table:** Feature resolution throws an exception. Wrap feature checks in try-catch or use a default value.
- **Feature class not registered:** `Feature::active()` returns false silently. Test feature registration in CI.
- **Scope mismatch:** Feature checked with wrong scope type returns unexpected result. Log scope resolution for debugging.

---

## Ecosystem Usage

Laravel Pennant is the recommended feature flag solution for Laravel applications. It integrates with Laravel's Blade, middleware, Artisan, and test framework. The `@feature` directive replaces manual `if` statements in Blade templates. The `EnsureFeatureIsActive` middleware protects routes without controller modification. Pennant is maintained by the Laravel core team and is included in the Laravel 11+ default installation.

---

## Related Knowledge Units

### Prerequisites
- Laravel Service Provider Registration
- Laravel Middleware and Blade Directives
- Basic Feature Flag Concepts

### Related Topics
- ConfigCat (cloud-managed alternative with targeting)
- LaunchDarkly (enterprise alternative)
- GrowthBook (open-source alternative with A/B testing)

### Advanced Follow-up Topics
- Custom Feature Resolution for A/B Testing
- Feature Flag Admin UI Development
- Feature Flag Lifecycle Management and Cleanup

---

## Research Notes

Laravel Pennant represents the framework's commitment to providing first-party solutions for common application patterns. Its design philosophy is simplicity and convention over configuration — it handles the 80% use case (basic feature flags) well while providing extension points for custom resolution logic. The lack of an admin UI is intentional — Pennant is designed as a developer tool, and flag management UIs can be built on top using the provided Artisan commands and database driver. The `@feature` Blade directive is a model of simplicity and demonstrates the value of framework-native solutions.
