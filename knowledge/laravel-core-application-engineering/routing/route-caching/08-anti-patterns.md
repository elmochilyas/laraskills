# Anti-Patterns â€” Route Caching
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Caching |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Route Caching in Production | High | High | oute:cache not run during deployment, forcing route parsing on every request |
| Caching Routes with Closures | High | Medium | Route file contains closures that can't be serialized for caching |
| Cache Not Invalidated After Route Changes | High | Medium | Route cache not cleared after adding/removing routes, old routes still served |
| Skipping Cache for Convenience During Development | Low | High | Developer runs oute:clear and forgets to recache for production |
| Route File Organization Preventing Caching | Medium | Medium | Routes structured so that parts can't be cached (e.g., dynamic route inclusion) |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Deployment Cache Script | Deployment pipeline doesn't include route:cache step | Routes parsed on every request in production |
| Mixed Closure and Controller Routes | Some routes use closures (uncacheable), others use controllers | Partial caching benefit, inconsistency |

## Anti-Pattern Details

### AP-RC-01: No Route Caching in Production
**Description**: Deployment pipeline doesn't run php artisan route:cache, so route registration happens on every request.
**Root Cause**: Deployment script omitted the step or developer unaware of its importance.
**Impact**: Every request parses and registers all routes, adding 50-200ms overhead.
**Detection**: No route cache file in bootstrap/cache/. Response times include route registration overhead.
**Solution**: Add php artisan route:cache to deployment script. Verify cache file exists post-deployment.

### AP-RC-02: Caching Routes with Closures
**Description**: Route file defines routes using closures instead of controller classes, preventing route caching.
**Root Cause**: Developer uses closures for simplicity without knowing they prevent caching.
**Impact**: Route cache can't serialize closures. oute:cache fails or requires --force.
**Detection**: php artisan route:cache fails with "Unable to prepare route [x] for serialization. Uses Closure."
**Solution**: Use controller classes for all routes. Never use closures in routes that need caching.

### AP-RC-03: Cache Not Invalidated After Route Changes
**Description**: Route cache persists after route file changes, serving old routes.
**Root Cause**: Deployment script doesn't run route:cache after pulling new code.
**Impact**: Old routes still served; new routes return 404. Stale route parameters.
**Detection**: After deployment, new routes don't work. php artisan route:list shows old routes.
**Solution**: Always run php artisan route:cache after route file changes in deployment.

### AP-RC-04: Skipping Cache for Convenience During Development
**Description**: Developer runs oute:clear during development for convenience and forgets to recache for production.
**Root Cause**: Development workflow requires frequent route clearing; production recache easily forgotten.
**Impact**: Production runs without route cache until next deployment or manual intervention.
**Detection**: Production server missing route cache file.
**Solution**: Automate route:cache in deployment pipeline. Use environment checks to prevent running without cache.

### AP-RC-05: Route File Organization Preventing Caching
**Description**: Routes organized using dynamic file inclusion (equire __DIR__.'/routes/api.php') that prevents full caching.
**Root Cause**: Custom route file organization that doesn't follow Laravel conventions.
**Impact**: Route cache may not work correctly or may skip some route files.
**Detection**: Some routes not cached. Custom route loading logic in RouteServiceProvider.
**Solution**: Use Laravel's built-in route file loading. Avoid dynamic requires of route files.
