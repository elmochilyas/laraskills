# Decomposition: Feature Routes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Routes
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Route Co-location with Features
- **Topics:** Each feature has its own `routes.php`, loaded by feature service provider
- **Key Content:** Placing route definitions inside the feature directory, keeping routes close to controllers
- **Learning Objectives:** Create per-feature route files co-located with the feature's controllers

### Chunk 2: Loading Routes via Feature Service Provider
- **Topics:** `loadRoutesFrom()` in feature service provider, route group configuration
- **Key Content:** Setting prefix, middleware, and name prefix per feature; route caching compatibility
- **Learning Objectives:** Register and configure feature routes through the feature's service provider

### Chunk 3: Route Name and URL Collision Prevention
- **Topics:** Route prefixes per feature, name namespacing, collision detection
- **Key Content:** `Route::prefix('billing')->name('billing.')`, detecting duplicate routes across features
- **Learning Objectives:** Apply route prefixing and name namespacing to prevent collisions between features

### Chunk 4: API vs Web Route Separation Within Features
- **Topics:** Separate route files for API and web within the same feature, middleware selection
- **Key Content:** `routes/api.php` and `routes/web.php` within a feature, conditional loading based on request type
- **Learning Objectives:** Separate API and web routes within a feature while maintaining co-location
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization