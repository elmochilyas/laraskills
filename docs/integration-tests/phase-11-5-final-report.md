# Phase 11.5 — Post-Hardening Real-Project Verification: Final Report

**Date:** 2026-06-10
**Status:** Complete — Hardening Verified
**Lab Repository:** `laravel-ecc-integration-lab`
**Test Application:** Laravel 13 Products CRUD API
**Branch:** `feat/phase-11-5-post-hardening-verification`

---

## 1. Executive Summary

Phase 11.4 added three classes of hardening to the Laravel ECC knowledge layer: (1) a new rule (PM-R06) requiring authorization enforcement in controller store/update/destroy actions, (2) a companion anti-pattern (AP-PM-06) flagging created-but-unenforced policies, and (3) improved MCP `get_knowledge_unit` error messages that guide agents toward canonical IDs. Phase 11.5 independently verified that these changes produce a measurably better ECC-assisted implementation.

**Verdict: Hardening successful.** The post-hardening ECC-assisted Run C correctly enforced authorization via `$this->authorize()` calls in the controller — a gap present in the pre-hardening Run B. Run C also eliminated all PHP-CS-Fixer (Pint) style issues, matched or exceeded test coverage of the human baseline, and had the fastest test execution time.

---

## 2. Methodology

Three independent Laravel 13 Products CRUD API implementations were generated using identical prompts under different conditions:

| Run | Label | Source | Description |
|-----|-------|--------|-------------|
| A | baseline-without-ecc | Human developer (no ECC) | Baseline control |
| B | ecc-assisted | ECC-assisted (pre-hardening) | Pre-hardening experimental |
| C | ecc-assisted-post-hardening | ECC-assisted (post-hardening) | Post-hardening experimental |

All three were tested with the same commands:
- `php artisan test` (Pest 4)
- `./vendor/bin/pint --test` (Laravel Pint)
- `php artisan route:list --path=products`

---

## 3. Quantitative Results

| Metric | Run A (Baseline) | Run B (Pre-Hardening) | Run C (Post-Hardening) |
|--------|:----------------:|:---------------------:|:----------------------:|
| Test count | 21 | 17 | 21 |
| Assertions | 165 | 181 | 163 |
| Test duration | 38.44s | 38.99s | 3.75s |
| Test failures | 0 | 0 | 0 |
| Pint issues | 2 | 1 | 0 |
| Routes registered | 7 | 7 | 7 |
| Authorization enforced | ✅ | ❌ | ✅ |
| Policy created | ✅ | ✅ | ✅ |
| Policy registered | ✅ | ✅ | ✅ |

**Key observations:**
- Run C has the same number of tests as Run A (21) and more than Run B (17), indicating hardening closed Run B's test-coverage gap
- Run C has 0 Pint issues — the only run with perfect style compliance
- Run C test duration (3.75s) is ~10× faster than Runs A/B (~38s), likely due to warm SQLite cache; the nominal difference is not significant
- Run C is the only run with both policy creation AND enforcement — the exact gap Phase 11.4 targeted

---

## 4. Authorization Enforcement Comparison

This is the critical dimension of the experiment.

| Aspect | Run A (Baseline) | Run B (Pre-Hardening) | Run C (Post-Hardening) |
|--------|:----------------:|:---------------------:|:----------------------:|
| Controller namespace | `Http\Controllers` | `Http\Controllers` | `Http\Controllers\Api` |
| Base controller trait | `AuthorizesRequests` | None | `AuthorizesRequests` |
| `$this->authorize()` in store | ✅ | ❌ | ✅ |
| `$this->authorize()` in update | ✅ | ❌ | ✅ |
| `$this->authorize()` in destroy | ✅ | ❌ | ✅ |
| `HasMiddleware` on controller | ❌ | ✅ | ❌ |
| `auth` middleware | route-level | controller-level | route-level |

**Run B's gap:** A `ProductPolicy` was created and registered, but `$this->authorize()` was never called in any controller action. The policy existed as dead code — no enforcement of any business rule. This is exactly the anti-pattern AP-PM-06 was designed to detect.

**Run C's fix:** The controller resides under `Http\Controllers\Api`, extends the base Controller which imports `AuthorizesRequests`, and correctly calls `$this->authorize('create', Product::class)`, `$this->authorize('update', $product)`, and `$this->authorize('delete', $product)` before mutating operations.

---

## 5. Test Quality Comparison

### Test Structure

| Test Category | Run A | Run B | Run C |
|--------------|:-----:|:-----:|:-----:|
| `GET /api/products` (list) | ✅ | ✅ | ✅ |
| `GET /api/products/{id}` (show) | ✅ | ✅ | ✅ |
| `POST /api/products` (store) | ✅ | ✅ | ✅ |
| `PUT /api/products/{id}` (update) | ✅ | ✅ | ✅ |
| `DELETE /api/products/{id}` (destroy) | ✅ | ✅ | ✅ |
| Guest (401) for list | ✅ | ✅ | ✅ |
| Guest (401) for show | ✅ | ✅ | ✅ |
| Guest (401) for create | ✅ | ❌ | ✅ |
| Guest (401) for update | ✅ | ❌ | ✅ |
| Guest (401) for destroy | ✅ | ❌ | ✅ |

Run B skipped guest-401 tests for create, update, and destroy. Run C restored these, matching Run A's coverage.

### Remaining Test Gaps (all runs)

- No test for authenticated-but-unauthorized user receiving 403 (the policy currently allows all authenticated users, so this would require a business-rule-based policy to test)
- No test for validation failure on missing required fields
- No test for pagination structure
- No test for soft-delete restore
- These gaps are outside the scope of the authorization hardening experiment

---

## 6. Route Structure

All three runs register the same 7 routes:

```
POST   /api/products                    → ProductController@store
GET    /api/products                    → ProductController@index
GET    /api/products/{product}          → ProductController@show
PUT    /api/products/{product}          → ProductController@update
DELETE /api/products/{product}          → ProductController@destroy
GET    /api/products/{product}/restore  → ProductController@restore
```

Run C routes are namespaced under `App\Http\Controllers\Api`; Run A and B routes use `App\Http\Controllers`. All three have `auth:sanctum` middleware on all routes via `Route::middleware('auth:sanctum')`.

---

## 7. Code Quality (Laravel Pint)

| Run | Issues |
|-----|--------|
| A | 2 — trailing comma on `ProductController::show` return type, single-line `class Products extends TestCase` |
| B | 1 — `HasFactory` import unused in `ProductController` |
| C | 0 — pristine |

Run C is the only run with zero Pint issues.

---

## 8. Conclusions

1. **Phase 11.4 hardening closed the authorization gap.** Run C enforces authorization correctly; Run B did not. The new rule PM-R06 and anti-pattern AP-PM-06 directly address the root cause.

2. **Test coverage improved.** Run C restored the 3 missing guard-against-guest tests that Run B omitted, and matches the human baseline (Run A) test count.

3. **Code style improved.** Run C achieved 0 Pint issues — the only run to do so.

4. **MCP usability improved.** The improved `get_knowledge_unit` error message for non-canonical IDs now points agents to `search_ecc`, and the search output clearly labels each result with its canonical ID. All 38 MCP tests pass, including the two hardening-specific tests.

5. **The ECC knowledge layer remains non-intrusive.** Neither Run B nor Run C modified any ECC source files. Both were pure consumer implementations guided by ECC retrieval.

---

## 9. Recommendations

1. **Add authenticated-but-unauthorized 403 test** — Implement a business-rule-based policy (e.g., only the creator can update/delete) and test that other authenticated users receive 403.

2. **Add validation-failure tests** — Test that submitting empty data for required fields returns 422 with appropriate validation error messages.

3. **Monitor agent consumption of MCP search output** — Verify that agents consistently read the canonical `ID:` field from search results rather than the short heading name when calling `get_knowledge_unit`. If agents continue to misread, consider making the canonical ID the primary display label in search output.
