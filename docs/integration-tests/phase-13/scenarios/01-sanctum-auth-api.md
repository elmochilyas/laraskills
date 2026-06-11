# Scenario 1 — Sanctum Authentication API

## Summary

| Aspect | Value |
|--------|-------|
| Scenario | Sanctum Authentication API |
| Prompt | `prompts/01-sanctum-auth-api.txt` |
| Baseline worktree | `<lab-root>/worktrees/01-sanctum-auth-api-baseline` |
| ECC worktree | `<lab-root>/worktrees/01-sanctum-auth-api-ecc-assisted` |
| Model | `opencode/deepseek-v4-flash-free` |
| Status | **Complete** |

---

## Baseline Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-10 23:45:03 |
| End timestamp | 2026-06-10 23:53:18 |
| Duration | 8m 15s |
| Tests | 14 / 14 PASS |
| Assertions | 49 |
| Test result | Full pass |
| Pint result | 1 FAIL (concat_space in AuthTest.php) |
| Routes | 9 (4 API + 1 Sanctum + 4 default) |
| Files created | 9 legitimate + **2 stray tinker artifacts** |

### Created Files (from `git status --short`)

**Modified (5):**
- `app/Models/User.php` — added HasApiTokens, attribute-driven Fillable/Hidden/Casts
- `bootstrap/app.php` — registered `api: __DIR__.'/../routes/api.php'`
- `composer.json` — added `"laravel/sanctum": "^4.3"`
- `composer.lock` — updated
- `tests/Pest.php` — enabled `RefreshDatabase`

**Untracked (11 total, 9 legitimate + 2 stray):**
- `app/Http/Controllers/AuthController.php`
- `app/Http/Requests/RegisterRequest.php`
- `app/Http/Requests/LoginRequest.php`
- `app/Http/Resources/UserResource.php`
- `config/sanctum.php`
- `database/migrations/2026_06_10_224111_create_personal_access_tokens_table.php`
- `routes/api.php`
- `tests/Feature/AuthTest.php`
- **`get('auth.guards'))`** — stray tinker artifact
- **`getMiddlewareGroups())`** — stray tinker artifact

### Verification Checklist

- [x] passwords are hashed — `#[Casts(['password' => 'hashed'])]` on User model
- [x] login rejects invalid credentials — returns 422 with `email` field error
- [x] /me requires authentication — `auth:sanctum` middleware
- [x] logout revokes the intended token — `currentAccessToken()->delete()`
- [x] validation rules exist — RegisterRequest (name, email unique, password min:8 confirmed), LoginRequest (email, password)
- [x] tests cover happy and negative paths — 12 tests, register/login/logout/me, duplicate email, wrong password, missing fields, short password, unauthenticated
- [x] routes are correct — 4 API routes + sanctum/csrf-cookie

### Architecture Notes

Uses `password_verify()` instead of `Hash::check()` in login (line 31 of AuthController.php). Functionally correct (both use bcrypt) but non-idiomatic. Returns HTTP 422 for invalid credentials instead of 401 — semantically incorrect but functionally works with 422 validation-error handling. Stray tinker artifact files indicate agent debugging output was not cleaned up.

---

## ECC-Assisted Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 00:04:42 |
| End timestamp | 2026-06-11 00:08:33 |
| Duration | 3m 50s |
| Tests | 14 / 14 PASS |
| Assertions | 45 |
| Test result | Full pass |
| Pint result | 1 FAIL (not_operator_with_successor_space in AuthController.php) |
| Routes | 9 (4 API + 1 Sanctum + 4 default) |
| Files created | 9 legitimate, **0 stray artifacts** |
| MCP tools called | 9 total |
| ECC domains selected | Security & Identity Engineering, Laravel Core Application Engineering |
| Retrieved KUs | `laravel-sanctum-spa-installation`, `form-request-validation-logic`, `laravel-read-write-config`, `security-identity-engineering/sanctum-spa-vs-token` |
| Estimated retrieval tokens | ~4,000 (standard mode bundle) |

### Created Files (from `git status --short`)

**Modified (6):**
- `app/Models/User.php` — added HasApiTokens (preserved default `password => hashed` cast)
- `bootstrap/app.php` — registered `api: __DIR__.'/../routes/api.php'`
- `composer.json` — added `"laravel/sanctum": "^4.3"`
- `composer.lock` — updated
- `config/auth.php` — added `sanctum` guard for API
- `tests/Pest.php` — enabled `RefreshDatabase`

**Untracked (9 total, 0 stray):**
- `app/Http/Controllers/AuthController.php`
- `app/Http/Requests/RegisterRequest.php`
- `app/Http/Requests/LoginRequest.php`
- `app/Http/Resources/UserResource.php`
- `config/sanctum.php`
- `database/migrations/2026_06_10_230717_create_personal_access_tokens_table.php`
- `routes/api.php`
- `tests/Feature/AuthTest.php`

### MCP Tool Call Sequence

| # | Tool | Arguments | Phase |
|---|------|-----------|-------|
| 1 | `retrieve_context_bundle` | `task: "sanctum authentication api"`, `mode: standard` | Planning |
| 2 | `validate_ecc` | (none) | Pre-implementation |
| 3 | `search_ecc` | `query: "sanctum authentication api laravel"`, `limit: 10` | Targeted search |
| 4 | `get_knowledge_unit` | `id: "laravel-sanctum-spa-installation"`, `include_content: true` | Deep read |
| 5 | `get_knowledge_unit` | `id: "form-request-validation-logic"`, `include_content: true` | Deep read |
| 6 | `get_knowledge_unit` | `id: "laravel-read-write-config"`, `include_content: true` | Deep read |
| 7 | `search_ecc` | `query: "sanctum token authentication API auth controller"`, `limit: 10` | Targeted search |
| 8 | `get_knowledge_unit` | `id: "security-identity-engineering/sanctum-spa-vs-token"`, `include_content: true` | Deep read |
| 9 | `search_ecc` | (from context) | Targeted search |

### Verification Checklist

- [x] passwords are hashed — `'password' => 'hashed'` cast in User model (default preserved)
- [x] login rejects invalid credentials — returns 401 with `{'message': 'Invalid credentials.'}`
- [x] /me requires authentication — `auth:sanctum` middleware
- [x] logout revokes the intended token — `currentAccessToken()->delete()`
- [x] validation rules exist — RegisterRequest (name max:255, email unique, password min:8 confirmed), LoginRequest (email, password)
- [x] tests cover happy and negative paths — 12 tests covering register/login/logout/me, validation errors, duplicate email, wrong password, unauthenticated access
- [x] routes are correct — 4 API routes + sanctum/csrf-cookie

### Architecture Notes

Uses `Hash::check()` (idiomatic Laravel). Invalid credentials returns HTTP 401 with consistent `'Invalid credentials.'` message (prevents user enumeration by using same message for wrong password and non-existent email). Explicit `sanctum` guard added to `config/auth.php`. Controller methods have `JsonResponse` return type hints. Custom validation messages for unique email, password length, and password confirmation mismatch. Zero stray artifact files. MCP tool calls visible in log with canonical KU IDs.

---

## Paired Comparison

| Category | Baseline | ECC | Delta | Code / Test Evidence |
|----------|:--------:|:---:|:-----:|----------------------|
| Functional correctness | 7 | 9 | +2 | Both 14/14 pass. Baseline returns 422 for invalid creds (wrong status); ECC returns correct 401. Baseline uses `password_verify()` (line 31); ECC uses `Hash::check()` (line 35). ECC has 4 fewer assertions (45 vs 49) but covers same scenarios. |
| Laravel convention adherence | 6 | 10 | +4 | Baseline: `password_verify()` instead of `Hash::check()` or `Auth::attempt()`. No return type hints. ECC: `Hash::check()`, `JsonResponse` return types, `sanctum` guard in `auth.php`, custom validation messages in RegisterRequest. |
| Architecture clarity | 7 | 9 | +2 | Both have thin 60-line controllers. ECC adds explicit `JsonResponse` return types, custom validation messages (RegisterRequest lines 23-29), and explicit sanctum guard registration in auth.php. |
| Validation quality | 7 | 8 | +1 | Both validate name, email (unique), password (min:8, confirmed) for register; email, password for login. ECC adds custom error messages (email.unique, password.min, password.confirmed). Neither adds password complexity rules (> length). |
| Security correctness | 6 | 9 | +3 | Baseline: `password_verify()` bypasses Hash facade; 422 for invalid creds is semantically wrong but doesn't leak user existence. ECC: `Hash::check()` proper; 401 with consistent `'Invalid credentials.'` message prevents user enumeration. Both use `'hashed'` cast and revoke tokens on logout. |
| Authorization correctness | 5 | 6 | +1 | Both use `auth:sanctum` middleware on protected routes. ECC also configures explicit `sanctum` guard. Neither adds resource-level authorization (not required for auth-only API). |
| Test completeness | 8 | 7 | -1 | Baseline: 12 tests, 49 assertions. ECC: 12 tests, 45 assertions. Both cover register (success + 4 negatives), login (success + 3 negatives), logout, /me, protected routes. Baseline has 4 more edge-case assertions. Neither tests token expiry, concurrent sessions, or rate limiting. |
| Maintainability | 7 | 9 | +2 | Both clean and straightforward. ECC adds return type hints, custom validation messages, explicit guard config. ECC has zero stray artifacts. |
| Explanation accuracy | 8 | 9 | +1 | Agent summaries both match code. ECC summary explicitly lists MCP tool calls by type and count. ECC lists assumptions (no email verification, no password reset, no rate limiting). Baseline does not mention `password_verify` trade-off. |
| Code style | 6 | 6 | 0 | Baseline: 1 Pint FAIL (concat_space in AuthTest.php). ECC: 1 Pint FAIL (not_operator_with_successor_space in AuthController.php). Both have 1 style issue in different files. |
| Execution efficiency | 7 | 9 | +2 | Baseline: 8m 15s, 2 stray artifacts. ECC: 3m 50s (54% faster), 0 stray artifacts, included 9 MCP tool calls. |
| **Average** | **6.7** | **8.3** | **+1.6** | |

---

## Defects Found

| Severity | Baseline | ECC-Assisted |
|----------|----------|--------------|
| Critical | None | None |
| Major | Wrong HTTP status for invalid creds (422 → 401); `password_verify()` instead of `Hash::check()` | None |
| Minor | 2 stray tinker artifacts; 1 Pint style issue; no return type hints | 1 Pint style issue; 4 fewer assertions than baseline; no rate limiting |

---

## Retrieval Quality Notes

The ECC agent followed the prescribed workflow correctly: `retrieve_context_bundle` (standard mode) → `validate_ecc` → `search_ecc` (3 calls with targeted queries) → `get_knowledge_unit` (4 calls with canonical IDs from search results). Total 9 MCP calls. The retrieved KUs were relevant to the task: Sanctum installation, Form Request validation, read/write config, and Sanctum SPA vs token distinction. Standard mode returned ~4,000 estimated tokens, which was sufficient for this focused task. The ECC agent did not exceed the retrieval budget and did not request redundant context.

---

## Verdict

**ECC-assisted wins with minor style warning.**

ECC-assisted is objectively superior on 8 of 11 categories, tied on 1 (code style), and loses narrowly on 1 (test completeness by 4 assertions). The critical wins are: correct HTTP status (401 vs 422), idiomatic `Hash::check()` (vs `password_verify()`), 54% faster execution (3m 50s vs 8m 15s), and zero stray artifacts. The single Pint issue (not_operator_with_successor_space) is a minor formatting concern. Baseline's `password_verify()` and incorrect 422 status are the most concerning differences, as they represent framework convention misunderstandings that ECC avoided.
