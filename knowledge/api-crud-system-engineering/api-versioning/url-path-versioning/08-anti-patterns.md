# URL Path Versioning: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | URL Path Versioning |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **No Default Version Handling** — `/api/` returns 404 without guidance
2. **Stale Route Cache** — Old cache served after adding new version
3. **Route Name Collision** — Same route name in two versions breaks URL generation
4. **Sub-version in URL** — Using `/api/v1.0/` or `/api/v1.0.0/` instead of major-only
5. **Mixed Versions in Same File** — Multiple version routes in the same file

## Repository-Wide Anti-Patterns

- Forgetting to add version prefix regex validation: `->where('version', 'v[0-9]+')`
- Not monitoring 404 rates on deprecated versions
- Not removing old version route files from loading when retired
- Controllers not organized in versioned namespace directories

---

## 1. No Default Version Handling

### Category
User Experience

### Description
The API root path (`/api/`) returns 404 without any guidance. Clients that access the root don't know which versions are available or how to access them.

### Why It Happens
Only versioned routes are registered. The root path has no handler.

### Warning Signs
- `GET /api` returns 404
- New team members don't know available versions
- No API root endpoint with version listing
- Consumers don't know how to discover the API
- Documentation doesn't mention the root endpoint

### Why Harmful
Lost discovery opportunity — the API root should guide consumers to available versions. A 404 at the root is a poor first impression.

### Real-World Consequences
A new API consumer visits `GET /api` to discover available endpoints. They receive 404. They assume the API is down or misconfigured. They file a support ticket asking "is the API working?"

### Preferred Alternative
Implement a root endpoint that returns a list of available versions with their status and links.

### Refactoring Strategy
1. Add a root endpoint handler for `/api`
2. Return a version manifest with links to active versions
3. Include version status (active, deprecated, sunset)
4. Link to documentation for each version
5. Test that the root endpoint returns helpful information

### Detection Checklist
- [ ] `/api` returns 404
- [ ] No version discovery mechanism
- [ ] No root endpoint
- [ ] Documentation doesn't mention root

### Related Rules/Skills/Trees
- Rule: API-ROOT-001 (Version Discovery)
- Skill: url-path-versioning
- Tree: api-versioning

---

## 2. Stale Route Cache

### Category
Deployment Error

### Description
After adding a new API version, the old route cache is still served. The new version's routes return 404 because the cache wasn't regenerated.

### Why It Happens
The deployment pipeline doesn't automatically run `route:cache` after route files change.

### Warning Signs
- New version routes return 404 but old version works
- `route:cache` not in deployment pipeline
- Routes work in development but not in production
- Deployment runbook doesn't mention route caching
- Cache cleared only manually

### Why Harmful
New version is effectively unavailable. Emergency debugging required. Deployment rollback or manual cache clear needed.

### Real-World Consequences
A team deploys V2 with new route files. `route:cache` was not run in the pipeline. V2 endpoints return 404 for 2 hours while the team debugs the issue. V2 launch is delayed.

### Preferred Alternative
Add `php artisan route:cache` to the deployment pipeline, triggered by route file changes.

### Refactoring Strategy
1. Add `route:cache` to deployment script
2. Add CI check that verifies route caching after route changes
3. Monitor route cache freshness
4. Add cache regeneration to deployment runbook
5. Automate cache clear and regeneration

### Detection Checklist
- [ ] New version routes return 404
- [ ] `route:cache` not in deployment
- [ ] Routes work in dev, fail in production
- [ ] Cache not regenerated automatically

### Related Rules/Skills/Trees
- Rule: API-DEPLOY-001 (Route Cache Regeneration)
- Skill: route-file-organization
- Tree: ci-cd

---

## 3. Route Name Collision

### Category
URL Generation Bug

### Description
Two versions define routes with the same name (e.g., `posts.index` for both V1 and V2). The `route()` helper resolves to the first registered version.

### Why It Happens
Route names are set without version prefixing: `->name('posts.index')`.

### Warning Signs
- `route('posts.index')` returns wrong version URL
- Tests using `route()` fail for specific versions
- Duplicate route name warnings in logs
- Pagination URLs point to wrong version
- Emails and notifications link to wrong version

### Why Harmful
URL generation is unreliable. Consumers receive links to the wrong version, causing confusion and errors.

### Real-World Consequences
A migration notification email uses `route('posts.show', $post)`. The helper resolves to V1 because it was registered first. V2 consumers click the link and are taken to V1's interface.

### Preferred Alternative
Prefix route names with version: `->name('v1.posts.index')`, `->name('v2.posts.index')`.

### Refactoring Strategy
1. Add version prefix to all route names
2. Update all `route()` calls to use versioned names
3. Add architecture test enforcing versioned route names
4. Verify URL generation with integration tests
5. Document route naming convention

### Detection Checklist
- [ ] Same route name in multiple versions
- [ ] `route()` returns unexpected version
- [ ] No version prefix in route names
- [ ] URL generation tests missing

### Related Rules/Skills/Trees
- Rule: API-ROUTE-006 (Versioned Route Names)
- Skill: route-file-organization
- Tree: api-versioning

---

## 4. Sub-version in URL

### Category
URL Clutter

### Description
Using `/api/v1.0/` or `/api/v1.0.0/` instead of `/api/v1/`. The full semantic version in the URL path is unnecessary and clutters the URL.

### Why It Happens
Directly mapping library SemVer to URL paths. The team uses the full version string from the version manifest.

### Warning Signs
- URL includes minor or patch version: `/v1.0/`, `/v1.2/`
- API root shows full version strings in paths
- URL changes with every patch release
- Consumers hardcode minor versions in URLs
- Documentation shows full version in URL examples

### Why Harmful
URLs change with every release (minor/patch). Consumers must update URLs for non-breaking updates. CDN cache invalidates with every release.

### Real-World Consequences
An API uses `/api/v1.2/`. A patch release changes to `/api/v1.3/`. All clients must update their URLs for a PATCH release (bug fix). The API breaks its own SemVer promise that PATCH releases are transparent.

### Preferred Alternative
Use only major version in URL path: `/api/v1/`. Use minor/patch in response headers or documentation.

### Refactoring Strategy
1. Change URL from `/api/v1.2/` to `/api/v1/`
2. Add redirect from old sub-version URLs
3. Remove sub-version from route prefixes
4. Include full version in response headers instead
5. Update documentation URL examples

### Detection Checklist
- [ ] URL includes minor or patch version
- [ ] URL changes with every release
- [ ] Consumers update URLs for minor releases
- [ ] CDN cache splits by sub-version

### Related Rules/Skills/Trees
- Rule: API-URL-007 (Major Version Only in URL)
- Skill: url-path-versioning
- Tree: api-versioning

---

## 5. Mixed Versions in Same File

### Category
Organization Failure

### Description
Multiple API versions are defined in the same route file with `Route::prefix()` groups. Diffs for one version show changes from all versions.

### Why It Happens
The project started with one file. New versions were added with prefix groups instead of separate files.

### Warning Signs
- Single `api.php` has `Route::prefix('v1')`, `Route::prefix('v2')`, etc.
- PR for V2 changes shows the entire file diff
- Code review must carefully separate V1 and V2 changes
- Removing a version requires editing the shared file
- New developers confuse which routes belong to which version

### Why Harmful
Accidental cross-version changes during edits. Difficult code reviews. Hard to remove a version (must edit the shared file).

### Real-World Consequences
A developer adds V3 routes to `api.php`. They accidentally remove a V1 route that looks similar to a V3 route. V1 consumers get 404. The code review doesn't catch the removal because the diff shows the entire file.

### Preferred Alternative
Create separate route files per version: `routes/api-v1.php`, `routes/api-v2.php`. Load them in `RouteServiceProvider`.

### Refactoring Strategy
1. Extract each version's routes to separate files
2. Remove version groups from the monolithic file
3. Update `RouteServiceProvider` to load per-version files
4. Add architecture test enforcing per-version files
5. Clean up the original file

### Detection Checklist
- [ ] Multiple versions in one file
- [ ] Prefix groups used for version separation
- [ ] PR diffs show all versions
- [ ] Removing a version requires editing shared file

### Related Rules/Skills/Trees
- Rule: API-ROUTE-007 (Separate Files per Version)
- Skill: route-file-organization
- Tree: code-organization
