# Route File Organization: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Route File Organization |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Monolithic Route File** — All versions in a single `routes/api.php` with messy diffs
2. **No Route Caching** — Routes regenerated on every request in production
3. **Dead Route Registration** — Route file exists but no longer loaded, confusing developers
4. **Route Name Collision** — Same route name in different versions breaks `route()` URL generation
5. **Config Loading Without Version Gating** — All versions always loaded regardless of activation status

## Repository-Wide Anti-Patterns

- Loading route files in `web.php` or `api.php` instead of `RouteServiceProvider`
- Forgetting to run `route:cache` after adding a new version
- Not loading oldest version first, causing accidental route shadowing
- Mixing shared routes (health, auth) into versioned route files

---

## 1. Monolithic Route File

### Category
Code Organization

### Description
All API versions are defined in a single `routes/api.php` file. V1, V2, and V3 routes are mixed together with `Route::prefix()` groups, making diffs messy and code review difficult.

### Why It Happens
The project started with one version in `api.php`. When V2 was added, routes were just added with a prefix group. No one created a separate file.

### Warning Signs
- Single `routes/api.php` file with multiple version groups
- PRs for V2 changes also show V1 route changes (false positives)
- Adding a new version means modifying the same file as other versions
- Diff between versions requires manual file reading
- `RouteServiceProvider` has no per-version file loading

### Why Harmful
Code reviews are harder — a change to V2 routes changes the same file as V1. Accidentally modifying V1 routes while adding V2 is easy. The file grows uncontrollably.

### Real-World Consequences
A developer adds V3 routes to `api.php`. In the same file, they accidentally remove a V1 route that they thought was V3-related. V1 consumers get 404. The diff review doesn't catch it because the diff shows the whole file.

### Preferred Alternative
Create separate route files per version: `routes/api-v1.php`, `routes/api-v2.php`. Load them in `RouteServiceProvider` with version prefix.

### Refactoring Strategy
1. Extract V1 routes to `routes/api-v1.php`
2. Extract V2 routes to `routes/api-v2.php`
3. Update `RouteServiceProvider` to load per-version files
4. Remove version groups from `api.php`
5. Add architecture test enforcing per-version files

### Detection Checklist
- [ ] Single file contains multiple versions
- [ ] PRs show unrelated version changes
- [ ] No per-version route files
- [ ] `RouteServiceProvider` loads one file

### Related Rules/Skills/Trees
- Rule: API-ROUTE-001 (Per-Version Route Files)
- Skill: route-file-organization
- Tree: code-organization

---

## 2. No Route Caching

### Category
Performance Waste

### Description
Running in production without `php artisan route:cache`. Routes are registered on every request, adding unnecessary overhead.

### Why It Happens
The deployment pipeline doesn't include route caching. New versions are added but the cache is never regenerated.

### Warning Signs
- `route:cache` never runs in deployment
- Routes work but response time includes route registration
- `php artisan route:list` shows correct routes (they're registered at runtime)
- Deployment script doesn't include `route:cache` step
- Production `.env` has `APP_ENV=local` behavior

### Why Harmful
Unnecessary overhead on every request. Route registration takes 50-500ms depending on the number of routes. This adds up to significant server load at scale.

### Real-World Consequences
An API with 300 routes across 3 versions processes 1000 requests/second. Without route caching, each request spends ~100ms on route registration. This consumes 10% of server CPU. Adding `route:cache` reduces this to near-zero.

### Preferred Alternative
Run `php artisan route:cache` in deployment pipeline. Regenerate cache whenever route files change.

### Refactoring Strategy
1. Add `php artisan route:cache` to deployment script
2. Run `php artisan route:clear` before cache to ensure clean state
3. Verify routes after caching with `php artisan route:list`
4. Add CI check that verifies route caching works
5. Monitor response time improvement after caching

### Detection Checklist
- [ ] No `route:cache` in deployment
- [ ] Response time includes route registration overhead
- [ ] Deployment script doesn't mention route caching
- [ ] Production running without cached routes

### Related Rules/Skills/Trees
- Rule: API-PERF-002 (Route Caching)
- Skill: route-file-organization
- Tree: performance

---

## 3. Dead Route Registration

### Category
Code Confusion

### Description
A route file exists in the repository for a retired version but is no longer loaded by `RouteServiceProvider`. Developers see the file and assume the version is active.

### Why It Happens
The version was removed from loading but the file was kept "for reference." No one cleans it up.

### Warning Signs
- Route file exists but is not loaded in `RouteServiceProvider`
- Developers ask "is V1 still active?" — the file exists but routes don't work
- `routes/` directory has files not referenced anywhere
- Comments say "deprecated" but the file remains
- No documentation about retired version files

### Why Harmful
Misleading — developers waste time investigating why routes defined in the file don't work. They may try to add changes to a dead file and not understand why they're not reflected.

### Real-World Consequences
A developer needs to add a hotfix to V1 routes. They find `routes/api-v1.php`, make changes, deploy. The fix doesn't work because the route file was removed from `RouteServiceProvider` 6 months ago. Emergency rollback ensues.

### Preferred Alternative
Remove retired version route files from loading. Archive them in a separate directory or tag in version control.

### Refactoring Strategy
1. Identify route files that exist but aren't loaded
2. Move archived route files to a `routes/archive/` directory
3. Add a README explaining the file status
4. Verify routes are not accessible in production
5. Add CI check for orphaned route files

### Detection Checklist
- [ ] Route file exists but isn't loaded
- [ ] File in `routes/` not referenced in `RouteServiceProvider`
- [ ] Developers confused about version status
- [ ] No archive directory for retired files

### Related Rules/Skills/Trees
- Rule: API-ROUTE-002 (Active Route File Management)
- Skill: route-file-organization
- Tree: code-organization

---

## 4. Route Name Collision

### Category
Runtime Error

### Description
Two versions use the same route name (e.g., `posts.index`) without version prefixing. The `route()` helper can't distinguish between V1 and V2 routes, returning an incorrect URL.

### Why It Happens
Route names are defined in per-version files without version prefix. V1's `->name('posts.index')` and V2's `->name('posts.index')` collide.

### Warning Signs
- `route('posts.index')` returns wrong version's URL
- URL generation in different contexts returns unexpected results
- Route name collision warning in Laravel debug
- Tests using `route()` helper get wrong URLs
- `php artisan route:list` shows duplicate route names

### Why Harmful
URL generation is unreliable. Emails, hypermedia links, and pagination URLs may point to the wrong version. Production bugs with version mismatches.

### Real-World Consequences
A migration email contains a link generated with `route('posts.show', $post)`. The route helper resolves to V1's URL because it was registered first. The user is directed to the old version's page.

### Preferred Alternative
Prefix route names with version: `->name('api.v1.posts.index')` or `->name('v1.posts.index')`.

### Refactoring Strategy
1. Audit all route names for collisions
2. Add version prefix to all route names
3. Use version-prefixed helpers: `route('v1.posts.index')`
4. Update all URL generation code to use prefixed names
5. Add CI check preventing duplicate route names

### Detection Checklist
- [ ] Duplicate route names across versions
- [ ] `route()` returns wrong version
- [ ] No version prefix in route names
- [ ] Tests fail with URL generation

### Related Rules/Skills/Trees
- Rule: API-ROUTE-004 (Version-Prefixed Route Names)
- Skill: route-file-organization
- Tree: api-versioning

---

## 5. Config Loading Without Version Gating

### Category
Inflexible Deployment

### Description
All version route files are loaded regardless of whether the version is active. Retired versions that should be disabled are still registered and accessible.

### Why It Happens
Route files are loaded unconditionally in `RouteServiceProvider`. There's no configuration flag to enable/disable a version.

### Warning Signs
- All versions always loaded regardless of status
- Retired versions still accessible
- No `config('api.versions.v1.active')` check
- Route files loaded in a hardcoded list
- Disabling a version requires code change and deployment

### Why Harmful
Cannot quickly disable a version in an emergency (security vulnerability). Retired versions remain accessible. Adding a new version requires code changes.

### Real-World Consequences
A security vulnerability is discovered in V1. The team needs to disable V1 immediately. The route file is loaded unconditionally — disabling V1 requires a deployment. The vulnerability is exposed for hours while the deployment pipeline runs.

### Preferred Alternative
Use config-gated loading: `if (config('api.versions.v1.active')) { ... }`. Disable versions via config change without deployment.

### Refactoring Strategy
1. Add `active` flag to version configuration
2. Gate route loading on `config('api.versions.{v}.active')`
3. Support disabling via environment variable or config change
4. Verify disabled versions return 404
5. Add monitoring for disabled version access attempts

### Detection Checklist
- [ ] Loading not gated by version config
- [ ] Retired versions still accessible
- [ ] No way to disable version without code change
- [ ] Hardcoded route file loading

### Related Rules/Skills/Trees
- Rule: API-ROUTE-005 (Config-Gated Version Loading)
- Skill: route-file-organization
- Tree: api-versioning
