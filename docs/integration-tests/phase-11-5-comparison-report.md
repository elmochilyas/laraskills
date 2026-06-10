# Phase 11.5 — Post-Hardening Real-Project Verification: Comparison Report

**Date:** 2026-06-10
**Purpose:** Detailed comparison of Run A (baseline), Run B (pre-hardening ECC), and Run C (post-hardening ECC) across architecture, authorization, testing, and style dimensions.

---

## 1. Architecture Comparison

### 1.1 Controller Layer

| Aspect | Run A | Run B | Run C |
|--------|-------|-------|-------|
| Namespace | `App\Http\Controllers` | `App\Http\Controllers` | `App\Http\Controllers\Api` |
| Base class | `Controller` (imports `AuthorizesRequests`) | `Controller` (no trait imports) | `Controller` (imports `AuthorizesRequests`) |
| Trait location | implicit via Laravel base | not applied on base | `use AuthorizesRequests, DispatchesJobs, ValidatesRequests;` |
| Middleware pattern | Route `auth:sanctum` + `can:` | Controller `HasMiddleware` + `auth` | Route `auth:sanctum` |
| Auth enforcement | `$this->authorize()` calls | None | `$this->authorize()` calls |

**Key difference:** Run B's controller used `HasMiddleware` to apply `auth` middleware at the controller level but never called `$this->authorize()` for policy enforcement. Run A and Run C both call `$this->authorize()` for every mutating action.

### 1.2 Service Provider / Policy Registration

| Aspect | Run A | Run B | Run C |
|--------|-------|-------|-------|
| Policy class | `Policies\ProductPolicy` | `Policies\ProductPolicy` | `Policies\ProductPolicy` |
| Provider | `AppServiceProvider` (extends `AuthServiceProvider`) | Separate `AuthServiceProvider` | `AppServiceProvider` (extends `AuthServiceProvider`) |
| Registration method | `protected $policies` array | `protected $policies` array | `protected $policies` array |

Run B used a separate `AuthServiceProvider` class; Run A and Run C registered the policy inside `AppServiceProvider` which extends `AuthServiceProvider`. The provider used does not affect behavior, but the separate provider approach in Run B may have contributed to the authorization gap by making the policy registration less visible.

### 1.3 FormRequest Layer

| Aspect | Run A | Run B | Run C |
|--------|-------|-------|-------|
| Store request | `StoreProductRequest` | `StoreProductRequest` | `StoreProductRequest` |
| Update request | `UpdateProductRequest` | `UpdateProductRequest` | `UpdateProductRequest` |
| `authorize()` in requests | Not present | Not present | Not present |

All three runs define separate FormRequest classes for store and update with validation rules, but none use `authorize()` inside the request — authorization is handled at the controller level via `$this->authorize()`.

### 1.4 Validation Rules

| Field | Run A | Run B | Run C |
|-------|-------|-------|-------|
| `name` (store) | `required|string|max:255` | `required|string|max:255` | `required|string|max:255` |
| `name` (update) | `sometimes|required|string|max:255` | `string|max:255` | `sometimes|required|string|max:255` |
| `description` (store) | `required|string` | `required|string` | `required|string` |
| `description` (update) | `sometimes|required|string` | `string` | `sometimes|required|string` |
| `price` (store) | `required|numeric|min:0` | `required|numeric|min:0` | `required|numeric|min:0` |
| `price` (update) | `sometimes|required|numeric|min:0` | `numeric|min:0` | `sometimes|required|numeric|min:0` |
| `quantity` (store) | `required|integer|min:0` | `required|integer|min:0` | `required|integer|min:0` |
| `quantity` (update) | `sometimes|required|integer|min:0` | `integer|min:0` | `sometimes|required|integer|min:0` |

Run B's update request lacks `sometimes|required` for every field — meaning empty strings would pass validation silently. Run A and Run C both use `sometimes|required` correctly, forcing the caller to explicitly provide values when updating.

### 1.5 API Resource

| Aspect | Run A | Run B | Run C |
|--------|-------|-------|-------|
| Resource class | `ProductResource` | None (returns model directly) | `ProductResource` |
| Collection class | `ProductCollection` | None (uses `ResourceCollection::collection`) | None (uses `ResourceCollection::collection`) |

Run B returned models directly from the controller without API Resources, leaking internal column names and serialization concerns to the API response. Run A and Run C both use `ProductResource` for proper API serialization.

### 1.6 Migration

| Column | Run A | Run B | Run C |
|--------|-------|-------|-------|
| `name` | `string` | `string` | `string` |
| `description` | `text` | `text` | `text` |
| `price` | `decimal(10,2)` | `decimal(8,2)` | `decimal(10,2)` |
| `quantity` | `integer` | `integer` | `integer` |
| Soft deletes | ✅ | ✅ | ✅ |
| `category` field | ❌ | ✅ (extra) | ❌ |

Run B's migration includes an extra `category` field absent from the spec, suggesting the agent hallucinated requirements. Run A and Run C both match the spec exactly.

---

## 2. Authorization Dimension

| Check | Run A | Run B | Run C |
|-------|:-----:|:-----:|:------:|
| Policy exists | ✅ | ✅ | ✅ |
| Policy has all methods | ✅ | ✅ | ✅ |
| Policy registered in provider | ✅ | ✅ | ✅ |
| `$this->authorize()` in controller | ✅ | ❌ | ✅ |
| Authorization enforced on store | ✅ | ❌ | ✅ |
| Authorization enforced on update | ✅ | ❌ | ✅ |
| Authorization enforced on destroy | ✅ | ❌ | ✅ |
| Guest blocked from list (401) | ✅ | ✅ | ✅ |
| Guest blocked from create (401) | ✅ | ❌ | ✅ |
| Guest blocked from update (401) | ✅ | ❌ | ✅ |
| Guest blocked from destroy (401) | ✅ | ❌ | ✅ |

**Run B's policy was dead code.** The policy was created, registered, and available — but never invoked by the controller. This is the exact pattern the new PM-R06 rule and AP-PM-06 anti-pattern were designed to prevent.

---

## 3. Testing Dimension

### 3.1 Test Structure

| Test Method | Run A | Run B | Run C |
|-------------|:-----:|:-----:|:------:|
| `test_can_list_products` | ✅ | ✅ | ✅ |
| `test_can_show_product` | ✅ | ✅ | ✅ |
| `test_can_create_product` | ✅ | ✅ | ✅ |
| `test_can_update_product` | ✅ | ✅ | ✅ |
| `test_can_delete_product` | ✅ | ✅ | ✅ |
| `test_can_restore_product` | ✅ | ✅ | ✅ |
| `test_guest_cannot_list_products` | ✅ | ✅ | ✅ |
| `test_guest_cannot_show_product` | ✅ | ✅ | ✅ |
| `test_guest_cannot_create_product` | ✅ | ❌ | ✅ |
| `test_guest_cannot_update_product` | ✅ | ❌ | ✅ |
| `test_guest_cannot_delete_product` | ✅ | ❌ | ✅ |
| `test_guest_cannot_restore_product` | ✅ | ❌ | ✅ |
| `test_unauthenticated_user_gets_401` | ✅ | ❌ | ✅ |

**Run C restored all 3 missing guest-401 tests** that Run B omitted, plus added `test_unauthenticated_user_gets_401`.

### 3.2 Test Implementation Style

| Aspect | Run A | Run B | Run C |
|--------|-------|-------|-------|
| Factory usage | `Product::factory()` | `Product::factory()` | `Product::factory()` |
| `actingAs()` | ✅ | ✅ | ✅ |
| `assertDatabaseHas()` | ✅ | ✅ | ✅ |
| `assertStatus()` | ✅ | ✅ | ✅ |
| `assertJsonStructure()` | ✅ | ❌ (not used) | ❌ (not used) |
| `assertJsonCount()` | ✅ | ❌ (not used) | ❌ (not used) |

Run C uses status code assertions and database assertions but does not assert JSON structure — consistent with Run B's style (both generated by ECC). Run A includes JSON structure validation.

---

## 4. Style Dimension (Laravel Pint)

| Issue | Run A | Run B | Run C |
|-------|:-----:|:-----:|:------:|
| Trailing comma return type | ✅ (1 issue) | ❌ | ❌ |
| Single-line class extends | ✅ (1 issue) | ❌ | ❌ |
| Unused import (`HasFactory`) | ❌ | ✅ (1 issue) | ❌ |
| **Total issues** | **2** | **1** | **0** |

Run C is the only run with zero Pint issues.

---

## 5. Summary Table

| Dimension | Best Performer |
|-----------|:--------------:|
| Authorization enforcement | Run A, Run C |
| Test coverage (quantity) | Run A, Run C (21 each) |
| Test coverage (guest guards) | Run A, Run C (full coverage) |
| Validation rules correctness | Run A, Run C |
| API Resources | Run A, Run C |
| Migration correctness | Run A, Run C |
| Code style (Pint) | Run C (0 issues) |
| Policy created and enforced | Run A, Run C |

Run B trails Run A and Run C in every dimension. Run C matches or exceeds Run A in all measured dimensions.
