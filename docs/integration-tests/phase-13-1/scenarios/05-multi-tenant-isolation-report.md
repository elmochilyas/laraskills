# Phase 13.1 — Scenario 05 Report: Multi-Tenant Isolation

## Prompt

Implement tenant-isolated project management endpoints in Laravel with Tenant model, Project model belonging to a Tenant, authenticated user belongs to one Tenant, list/create/show/update/delete Project endpoints, tenant isolation for every query, prevent cross-tenant reads and writes, tenant-aware validation for unique project slug, policy or equivalent authorization enforcement, dedicated Form Requests, API Resources, feature tests proving no cross-tenant leakage, intentional 403 or 404 behavior.

## Per-Scenario Verification Checklist

| Requirement | Baseline-Controlled | ECC-Voluntary | ECC-Required |
|-------------|-------------------|---------------|--------------|
| Tenant model | ✓ | ✓ (#[Fillable]) | ✓ (users() BUG: missing `return`) |
| Every query tenant-scoped | ✓ (query-level) | ✓ (route binding + abort) | Partial (Policy-only for show/update/delete) |
| Route-model binding leak-proof | ✓ (where + findOrFail) | ✓ (abort after binding) | ✗ (Policy only, no query scope) |
| Create uses tenant context | ✓ | ✓ | ✓ |
| Update/Delete enforce isolation | ✓ | ✓ | ✓ (via Policy) |
| Tenant-aware unique slug | ✓ (DB + validation) | ✓ (DB + validation) | ✓ (DB + validation) |
| Negative leakage tests | 4 tests | 3 tests | 4 tests |

## Implementation Comparison

### Architecture

| Aspect | Baseline | Voluntary | Required |
|--------|----------|-----------|----------|
| Isolation strategy | Query scope + Policy | Manual abort + route binding | Policy only |
| Cross-tenant response | 404 (ModelNotFound) | 404 (abort) | 403 (Policy) |
| Policy | Yes (secondary gate) | None | Yes (primary gate) |
| Defense layers | 2 (query + Policy) | 1 (abort check) | 1 (Policy only) |
| FormRequests | Yes | Yes | Yes |
| API Resources | Yes | Yes | Yes |
| Model attributes | Legacy `$fillable` | `#[Fillable]` (Laravel 13) | Legacy `$fillable` |
| Auth guard | `auth` | `auth:sanctum` | `auth` |

### Tenant Isolation Approaches

**Baseline-Controlled (2-layer, recommended):**
```
Query: Project::where('tenant_id', $user->tenant_id)->findOrFail($id)  → 404
Policy: $user->tenant_id === $project->tenant_id                       → 404 (secondary)
```

**ECC-Voluntary (1-layer, manual):**
```
Route binding: Project $project
Manual check: $project->tenant_id !== auth()->user()->tenant_id ? abort(404)
No Policy class
```

**ECC-Required (1-layer, Policy-based):**
```
Route binding: Project $project
Policy: $user->tenant_id === $project->tenant_id  → 403
No query-level scoping on individual operations
```

### Key Differences

1. **Baseline-Controlled** (Score: 87.0): The most robust approach. Query-level scoping with `where('tenant_id')->findOrFail()` is the primary defense, with Policy as a secondary gate. Returns 404 for cross-tenant access (no info leakage). 17 tests, 29 assertions. Has partial update test (unique to this implementation).

2. **ECC-Voluntary** (Score: 72.5): Uses route model binding + manual `abort(404)` checks. No Policy class. Best Laravel 13 attribute usage (`#[Fillable]`). Lowest test coverage (11 tests, 25 assertions). Missing: Policy layer, pagination test.

3. **ECC-Required** (Score: 77.0): Policy-only approach is architecturally cleanest but lacks defense-in-depth. Has a bug in `Tenant->users()` (missing `return` keyword). Most comprehensive test suite (21 tests, 35 assertions) including pagination and per-endpoint auth checks. Returns 403 (information leakage concern). User factory doesn't set `tenant_id`.

### Bug Notice: ECC-Required Tenant Model

```php
// Line 20 of app/Models/Tenant.php in ecc-required worktree
// BUG: Missing 'return' keyword
public function users(): HasMany
{
    $this->hasMany(User::class);  // ← Missing 'return' — returns null
}
```

This bug means `$tenant->users` silently returns `null` at runtime instead of the relationship. It was not caught by tests because the test suite primarily exercises the Project API, not Tenant model relationships.

## Scoring

| Category | Weight | Baseline | Voluntary | Required |
|----------|--------|----------|-----------|----------|
| Functional correctness | 1× | 9 | 8 | 7 |
| Laravel convention adherence | 1× | 9 | 8 | 8 |
| Architecture clarity | 1× | 9 | 7 | 7 |
| Validation quality | 1× | 9 | 8 | 8 |
| Security correctness | 1× | 9 | 7 | 6 |
| Authorization correctness | 1× | 9 | 7 | 8 |
| Test completeness | 2× | 8 (16) | 6 (12) | 9 (18) |
| Maintainability | 1× | 8 | 7 | 7 |
| Code style | 0.5× | 10 (5) | 10 (5) | 10 (5) |
| Execution efficiency | 0.5× | 8 (4) | 7 (3.5) | 7 (3.5) |
| **Total** | | **87.0** | **72.5** | **77.0** |

## Test Results

| Metric | Baseline | Voluntary | Required |
|--------|----------|-----------|----------|
| Test count | 17 | 11 | 21 |
| Assertion count | 29 | 25 | 35 |
| Pass rate | 100% | 100% | 100% |
| Duration | 2.51s | 1.90s | 4.06s |

## Timing

| Mode | Duration | vs. Baseline |
|------|----------|-------------|
| Baseline-Controlled | 6m 53s | — |
| ECC-Voluntary | 8m 50s | **+28%** |
| ECC-Required | 8m 6s | **+18%** |

## MCP Usage

| Mode | retrieve | search | get_ku | validate | Total |
|------|----------|--------|--------|----------|-------|
| Base | 0 | 0 | 0 | 0 | 0 |
| Vol | 2 | 0 | 10 | 0 | 12 |
| Req | 10 | 33 | 41 | 10 | 94 |

## Key Takeaway

Baseline-Controlled (87.0) produced the best result despite having no MCP access. This is the only scenario where ECC did not improve scores. Two factors explain this: (1) multi-tenant isolation is well-covered by standard Laravel documentation and common patterns, so the baseline agent had sufficient knowledge; (2) the ECC-required agent's Policy-only approach lacked defense-in-depth (no query-level scoping) and contained a code bug.

ECC-Voluntary's manual `abort` pattern without a Policy layer was the weakest approach — less secure and harder to maintain. The 12 MCP calls for KU retrieval did not prevent this architectural weakness.

The ECC-required agent made 94 MCP calls (highest of any run) but this did not yield the best score, suggesting excessive retrieval can crowd out implementation quality.
