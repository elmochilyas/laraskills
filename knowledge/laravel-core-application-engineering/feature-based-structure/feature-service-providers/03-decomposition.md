# Decomposition: Feature Service Providers

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Service Providers
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Feature Provider Structure
- **Topics:** Single feature-level service provider, registration responsibilities
- **Key Content:** `FeatureServiceProvider` naming, `boot()` and `register()` methods per feature, provider registration order
- **Learning Objectives:** Create a service provider per feature that handles all of that feature's registrations

### Chunk 2: Loading Routes, Views, and Migrations
- **Topics:** `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()` in feature providers
- **Key Content:** Configuring view namespace (`feature-name::`), migration autoloading, route loading
- **Learning Objectives:** Use provider methods to load feature-specific routes, views, and migrations

### Chunk 3: Binding Interfaces and Registrations
- **Topics:** Registering feature-specific bindings, repository-to-implementation binding
- **Key Content:** `$this->app->bind()` in feature provider, conditional registration based on configuration
- **Learning Objectives:** Register feature-specific interface bindings and service registrations in the provider

### Chunk 4: Provider Registration in config/app.php
- **Topics:** Adding feature providers to the application provider list, deferring vs eager providers
- **Key Content:** `providers` array, conditional registration based on feature flags, deferred provider patterns
- **Learning Objectives:** Register feature providers in the application and use conditional/feature-flag-based registration
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization