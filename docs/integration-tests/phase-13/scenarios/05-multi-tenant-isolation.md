# Scenario 5 — Multi-Tenant Isolation

## Summary

| Aspect | Value |
|--------|-------|
| Scenario | Implement CRUD with strict tenant isolation using 404 (not 403) for cross-tenant access |
| Prompt | `prompts/05-multi-tenant-isolation.txt` |
| Baseline worktree | `<lab-root>/worktrees/05-multi-tenant-isolation-baseline` |
| ECC worktree | `<lab-root>/worktrees/05-multi-tenant-isolation-ecc-assisted` |
| Model | `opencode/deepseek-v4-flash-free` |
| Status | **Complete** |

---

## Baseline Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 01:20:47 |
| End timestamp | 2026-06-11 01:25:33 |
| Duration | 4.82 min |
| Tests | 16 / 16 PASS |
| Assertions | 37 |
| Test result | Full pass |
| Pint result | FAIL — 1 style issue (40 files, 1 with issues) |
| Routes | 5 (CRUD via `Route::apiResource`) under `prefix('api')->middleware('auth')` in `routes/web.php` |
| Files created | 18+ (migrations, models, factories, controller, requests, resource, policy, tests) |

### Created/Modified Files

**Modified (4):**
- `app/Models/User.php` — added `belongsTo tenant` relationship, `tenant_id` fillable
- `app/Http/Controllers/Controller.php` — added `AuthorizesRequests` trait
- `app/Providers/AppServiceProvider.php` — registered `ProjectPolicy`, added `Route::bind('project')` scoped to user's tenant
- `tests/Pest.php` — added `RefreshDatabase` to Feature group
- `routes/web.php` — added `prefix('api')->middleware('auth')->apiResource('projects')`

**Untracked (14):**
- `database/migrations/2025_06_11_000001_create_tenants_table.php`
- `database/migrations/2025_06_11_000002_add_tenant_id_to_users_table.php`
- `database/migrations/2025_06_11_000003_create_projects_table.php`
- `app/Models/Tenant.php`
- `app/Models/Project.php`
- `app/Policies/ProjectPolicy.php`
- `app/Http/Controllers/ProjectController.php`
- `app/Http/Requests/StoreProjectRequest.php`
- `app/Http/Requests/UpdateProjectRequest.php`
- `app/Http/Resources/ProjectResource.php`
- `database/factories/TenantFactory.php`
- `database/factories/ProjectFactory.php`
- `tests/Feature/ProjectTest.php`

### Architecture

```
web.php: prefix('api')->middleware('auth')->apiResource('projects', ProjectController)
                                          ↓
AppServiceProvider::boot()
  → Route::bind('project', fn($id) => auth()->user()->tenant->projects()->findOrFail($id))
  → Central route-based tenant isolation — any route with {project} auto-scopes
                                          ↓
ProjectController
  → tenantProjects() helper: auth()->user()->tenant->projects()
  → $this->authorize() calls on each action
  → Route binding handles isolation for show/update/delete (404 on cross-tenant)
                                          ↓
ProjectPolicy
  → viewAny/create: tenant_id !== null
  → view/update/delete: user->tenant_id === project->tenant_id
                                          ↓
FormRequests
  → StoreProjectRequest: authorize() returns true, slug unique scoped to tenant_id
  → UpdateProjectRequest: authorize() returns true, slug unique ignores self
```

#### Key Design Decision: Route Binding

The baseline uses a single `Route::bind('project')` callback in `AppServiceProvider::boot()` that scopes every `{project}` parameter to the authenticated user's tenant. This means:
- The controller never manually scopes queries — route binding handles it centrally
- Cross-tenant access returns **404** (via `findOrFail`) — not 403 — preventing information leakage
- The policy is a secondary defense layer (policies check `tenant_id` match before permitting `view`/`update`/`delete`)

This is a **centralized approach**: one place enforces isolation for all resource operations.

### Verification Checklist

- [x] Tenant model with `hasMany users` and `hasMany projects`
- [x] User model with `belongsTo tenant` and `tenant_id` fillable
- [x] Project model with `belongsTo tenant`, composite unique `(tenant_id, slug)`
- [x] Route binding scopes every `{project}` parameter to user's tenant
- [x] Policy matches `tenant_id` for view/update/delete
- [x] Policy checks `tenant_id !== null` for viewAny/create
- [x] 404 for cross-tenant access, not 403
- [x] 401 for unauthenticated requests
- [x] Slug unique within tenant, reusable across tenants
- [x] 16 tests with 37 assertions — all passing

### Defects

1. **FormRequest authorize() returns true**: `StoreProjectRequest` and `UpdateProjectRequest` both return `authorize(): true`. While the route `auth` middleware and policy cover this, the FormRequest should ideally check `$this->user()->can('create', Project::class)` for defense in depth.
2. **Unused import in AppServiceProvider**: `use Illuminate\Support\Facades\Gate;` is imported but never called directly (policy is registered via `$policies` property). This caused the 1 Pint issue.
3. **AppServiceProvider extends AuthServiceProvider**: Extends `AuthServiceProvider` instead of the standard `ServiceProvider` to call `$this->registerPolicies()`. Works but is non-standard — typically policy registration happens in a dedicated `AuthServiceProvider`.

---

## ECC-Assisted Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 01:26:54 |
| End timestamp | 2026-06-11 01:31:54+ (timed out at 5 min) |
| Duration | 5.00+ min (timed out) |
| Tests | 16 / 16 PASS |
| Assertions | 27 |
| Test result | Full pass |
| Pint result | FAIL — 2 style issues (43 files, 2 with issues) |
| Routes | 6 (5 CRUD + `/api/user` from Sanctum) under `auth:sanctum` in `routes/api.php` |
| Files created | 20+ (includes Sanctum boilerplate) |

### Created/Modified Files

**Sanctum installation (automatic from `php artisan install:api`):**
- `config/sanctum.php` — Sanctum config
- `database/migrations/2025_06_11_000000_create_personal_access_tokens_table.php` — PAT migration
- `routes/api.php` — created by `install:api`

**Domain files (manual):**
- `database/migrations/2025_06_11_000001_create_tenants_table.php`
- `database/migrations/2025_06_11_000002_add_tenant_id_to_users_table.php`
- `database/migrations/2025_06_11_000003_create_projects_table.php`
- `app/Models/Tenant.php`
- `app/Models/Project.php`
- `app/Policies/ProjectPolicy.php`
- `app/Http/Controllers/Api/ProjectController.php`
- `app/Http/Requests/StoreProjectRequest.php`
- `app/Http/Requests/UpdateProjectRequest.php`
- `app/Http/Resources/ProjectResource.php`
- `database/factories/TenantFactory.php`
- `database/factories/ProjectFactory.php`
- `tests/Feature/ProjectIsolationTest.php`

**Modified (2):**
- `app/Models/User.php` — added `belongsTo tenant`, `tenant_id` fillable
- `bootstrap/app.php` — registered `api` routes, Sanctum middleware aliases

### MCP Tool Call Sequence

**Zero MCP calls.** The ECC agent completed the entire task without calling any ECC MCP tools. No `retrieve_context_bundle`, no `get_knowledge_unit`, no `search_ecc`, no `validate_ecc`.

This is the first scenario where the ECC agent made zero MCP calls — a significant regression in workflow adherence from Scenario 4 (7 calls).

### Architecture

```
api.php: middleware('auth:sanctum')->apiResource('projects', Api\ProjectController)
                                          ↓
(No route binding — manual scoping in every controller method)
                                          ↓
Api\ProjectController
  → Each method manually scopes: Project::where('tenant_id', auth()->user()->tenant_id)
  → show/update/delete use firstOrFail() for 404 on cross-tenant
  → store injects tenant_id from authenticated user
                                          ↓
ProjectPolicy (identical to baseline)
  → viewAny/create: tenant_id !== null
  → view/update/delete: user->tenant_id === project->tenant_id
                                          ↓
FormRequests
  → StoreProjectRequest: authorize() checks tenant_id !== null
  → UpdateProjectRequest: authorize() checks tenant_id !== null
  → slug unique scoped to tenant_id on both
```

#### Key Design Decision: Sanctum + Manual Scoping

The ECC agent chose to install Sanctum (`composer require laravel/sanctum` + `php artisan install:api`) and use API token authentication. This adds:
- A `composer.json` change pulling in `laravel/sanctum`
- A personal access tokens migration
- `config/sanctum.php` configuration file
- `routes/api.php` with Sanctum middleware

Unlike the baseline's centralized route binding, the ECC controller repeats the tenant scoping query in every method (5 times). This is a **decentralized approach** — each method independently enforces isolation.

The test file includes an excellent design-decision comment block documenting the intentional 404-vs-403 choice with security rationale (preventing information leakage about resource existence in other tenants).

### Verification Checklist

- [x] Tenant model with `hasMany users` and `hasMany projects`
- [x] User model with `belongsTo tenant` and `tenant_id` fillable
- [x] Project model with `belongsTo tenant`, composite unique `(tenant_id, slug)`
- [x] Manual tenant_id scoping on every controller method
- [x] Policy matches `tenant_id` for view/update/delete
- [x] Policy checks `tenant_id !== null` for viewAny/create
- [x] 404 for cross-tenant access, not 403
- [x] 401 for unauthenticated requests, 403 for users without tenant_id
- [x] Slug unique within tenant, reusable across tenants
- [x] Specific test for "user without a tenant cannot create projects"
- [x] 16 tests with 27 assertions — all passing
- [x] `@mixin \App\Models\Project` PHPDoc on ProjectResource
- [x] Design decision block in test file explains 404 vs 403 rationale

### Defects

1. **Repository DTO absent (minor)**: No `ProjectData` DTO — data crosses from request to controller to model as raw arrays. Follows the task spec but deviates from the "DTO-driven" Laravel patterns skill.
2. **No route binding**: Unlike the baseline's centralized `Route::bind('project')`, the ECC controller repeats `where('tenant_id', auth()->user()->tenant_id)` in 5 methods. More error-prone if a future developer forgets to add it to a new method.
3. **Forgot `tenant_id` in fillable on first attempt**: The ECC agent initially set `Project::$fillable` without `tenant_id`, causing a NOT NULL constraint failure that was caught and fixed mid-run.
4. **Sanctum overhead**: Installing Sanctum for a single-resource CRUD adds ~200KB of dependencies, a migration, and config file — unnecessary for this task scope.

---

## Paired Comparison

| Category | Baseline | ECC | Delta | Code / Test Evidence |
|----------|:--------:|:---:|:-----:|----------------------|
| Functional correctness | 10 | 10 | 0 | Both: 16/16 PASS, full CRUD + tenant isolation + 404 cross-tenant + unique slugs. Task requirements met identically. |
| Laravel convention adherence | 8 | 9 | +1 | Baseline: web routes with `auth` for API (non-standard), `auth: true` FormRequest authorize (no-op). ECC: Sanctum API auth with proper Bearer tokens, `@mixin` PHPDoc, `auth:sanctum` middleware, Api namespace. Follows modern Laravel API conventions. |
| Architecture clarity | 9 | 7 | -2 | Baseline: centralized route binding enforces isolation in one place, DRY `tenantProjects()` helper. ECC: per-method query repetition (5×), no central isolation point. Baseline wins on DRY principle and centralized enforcement. |
| Validation quality | 8 | 8 | 0 | Both: tenant-scoped slug uniqueness, required name+slug, optional description. Baseline adds `sometimes+required` on update slug; ECC adds `max:65535` on description. Marginal differences. |
| Security correctness | 8 | 9 | +1 | Both: 404 for cross-tenant, policy enforcement, tenant-scoped queries. Baseline: FormRequests return `authorize: true` (no defense in depth). ECC: FormRequests check `tenant_id !== null` in `authorize()`, preventing orphan users from submitting data. |
| Authorization correctness | 10 | 10 | 0 | Identical policies in both. Correct tenant_id matching on all resource operations. |
| Test completeness | 9 | 8 | -1 | Baseline: 37 assertions, `describe()` groups, tests for list/view/create/update/delete + 404 + 401 + validation. ECC: 27 assertions (fewer), flat structure with section comments, adds "user without a tenant" test but overall fewer assertions per test. |
| Maintainability | 9 | 7 | -2 | Baseline: DRY `tenantProjects()`, central route binding, fewer files. ECC: repetitive scoping queries, Sanctum dependency that must be maintained, more total files. Baseline is easier to extend without introducing isolation bugs. |
| Explanation accuracy | 8 | 9 | +1 | ECC includes a detailed design-decision comment block in the test file explaining the 404-vs-403 reasoning — excellent documentation. Baseline's summary is accurate but less educational. Example: `// Intentionally uses 404 (via findOrFail-style scoping) rather than 403 to prevent leaking resource existence across tenant boundaries.` |
| Code style | 9 | 8 | -1 | Baseline: 1 Pint issue (unused import in AppServiceProvider). ECC: 2 Pint issues (ProjectResource strict_types + ordered_imports in bootstrap/app.php). Baseline has fewer style violations. |
| Execution efficiency | 8 | 6 | -2 | Baseline: 4.82 min. ECC: 5.00+ min (timed out). ECC spent ~30-60s on Sanctum install (`composer require` + `php artisan install:api` + config + migration) — unnecessary overhead for this task. |
| **Average** | **8.7** | **8.3** | **-0.4** | |

---

## Defects Summary

| Severity | Baseline | ECC-Assisted |
|----------|----------|--------------|
| Critical | None | None |
| Major | None | None |
| Minor | FormRequest `authorize: true` (no defense in depth); AppServiceProvider unused import; extends wrong base class | Per-method query repetition; missing `tenant_id` in fillable on first attempt; Sanctum overhead; fewer assertions |

---

## Retrieval Quality Notes

The ECC agent made **zero MCP calls** — a stark regression from Scenario 4 (7 calls). The agent completed the full task (Tenant/Project migrations, models, Sanctum install, policy, controller, tests, verification) without querying the ECC knowledge layer even once.

This is the first scenario where the `--pure` and non-pure runs behaved identically in terms of ECC tool usage. The agent's output is indistinguishable from what a baseline agent would produce, except for the Sanctum installation choice (which may have been influenced by general training data rather than ECC knowledge).

Potential explanations:
- The agent's self-correction loop during the long-running task may have deprioritized MCP calls
- The multi-tenant isolation domain may be well-covered in the model's training data, reducing perceived need for external knowledge
- The Sanctum installation decision consumed planning bandwidth that could have been used for ECC queries

---

## Verdict

**Baseline wins — better architecture through centralized isolation.**

The baseline's `Route::bind('project')` approach is architecturally superior: one place enforces tenant isolation for all resource operations, keeping the controller clean and DRY. The ECC agent's per-method query repetition is more error-prone and less maintainable.

The ECC agent's Sanctum choice is defensible (API auth on an API endpoint) but added unnecessary overhead — 30-60s of install time, extra files, and composer dependencies — for a task that didn't require token-based authentication.

The most significant finding is the **zero MCP calls** from the ECC agent. This scenario demonstrates that ECC knowledge layer adoption is inconsistent across agents and tasks. Without MCP usage, the ECC run is effectively identical to a baseline run with the model's default knowledge, making the ECC value-add invisible in this scenario.
