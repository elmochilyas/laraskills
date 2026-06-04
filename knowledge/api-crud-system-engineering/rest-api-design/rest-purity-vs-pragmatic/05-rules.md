# REST Purity vs Pragmatic

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-purity-vs-pragmatic
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Default To REST, Deviate With Documentation
---
## Category
Architecture
---
## Rule
Always default to REST conventions for all endpoints — document every pragmatic deviation with explicit justification, costs, and client impact.
---
## Reason
REST conventions (proper methods, status codes, resource URLs) provide a predictable baseline that all HTTP clients understand. Deviations require special client handling, additional documentation, and create exceptions that increase the learning curve. Documenting each deviation forces the developer to justify the trade-off and makes the exception visible to the entire team.
---
## Bad Example
```php
// Undocumented deviation — POST for search with no explanation
Route::post('users/search', [UserController::class, 'search']);
// Future maintainers don't know why POST was chosen over GET
```

## Good Example
```php
/**
 * POST /users/search — GET deviation
 * Justification: Complex multi-field filters exceed URL length limits (~4KB).
 * Cost: Clients must use POST instead of GET; no HTTP-level caching.
 * Migration: Consider POST with Cache-Control headers for application-level caching.
 */
Route::post('users/search', [UserController::class, 'search']);
```

## Exceptions
Trivial deviations that are self-documenting and universally accepted (e.g., POST for action endpoints like cancel). Still document briefly — "Action endpoint: side effects beyond state change."

## Consequences Of Violation
Undocumented exceptions become permanent design debt; future developers replicate deviations without understanding the reasoning; API drifts from RESTful baseline to RPC-like without anyone noticing.
---

## Be Consistent Over Pure
---
## Category
Maintainability
---
## Rule
Always prioritize consistency over purity — a consistently pragmatic API is better than an inconsistently pure one that mixes REST and RPC patterns without a clear rationale.
---
## Reason
Inconsistency is the most harmful API quality. An API that consistently uses POST for all writes (pragmatic, predictable) is easier to integrate with than one that uses REST for users, RPC for orders, and custom patterns for products. Clients can adapt to any consistent convention but cannot efficiently handle mixed paradigms.
---
## Bad Example
```php
// Inconsistent — no pattern
// Users: pure REST
GET /users, POST /users, DELETE /users/{id}
// Orders: RPC
POST /orders/create, POST /orders/cancel, POST /orders/ship
// Products: custom
GET /getProducts, POST /updateProduct, POST /deleteProduct
```

## Good Example
```php
// Consistent — either REST or RPC, not both
// Option A: Resource-oriented (consistent)
GET /users, POST /users, PATCH /orders/{id}
// Option B: Action-oriented (consistent)
POST /users/create, POST /orders/create, POST /orders/cancel
```

## Exceptions
During API migration from one paradigm to another. Document which version uses which paradigm and provide a migration guide.

## Consequences Of Violation
Clients cannot predict endpoint patterns; client code becomes complex with per-endpoint special cases; each new developer adds their preferred pattern; API becomes increasingly inconsistent over time.
---

## Use The Deviation Decision Matrix
---
## Category
Architecture
---
## Rule
Always apply the four-question deviation decision matrix before deviating from REST: (1) Client cost — requires special handling? (2) Documentation cost — must be documented as exception? (3) Migration cost — makes future changes harder? (4) Tooling cost — breaks standard HTTP tooling? — if any answer is "yes," reconsider the deviation.
---
## Reason
The decision matrix makes deviation evaluation objective and repeatable. Without it, deviations are approved based on developer preference rather than objective assessment. Each "yes" answer represents real cost that must be weighed against the benefit the deviation provides.
---
## Bad Example
```php
// Deviation approved without matrix — client cost ignored
Route::post('orders/batch/process', [OrderController::class, 'processBatch']);
// Client cost: yes (special endpoint). Doc cost: yes. Migration cost: yes. 
// Tooling cost: yes (POST for batch). — Should have been reconsidered
```

## Good Example
```php
// Matrix applied — deviation justified
// GET /reports/summary with complex filters exceeds URL limit
// Client cost: low (POST instead of GET on this endpoint only)
// Documentation cost: low (one endpoint documented as POST)
// Migration cost: low (can add GET later, support both)
// Tooling cost: low (POST is well-supported)
// Decision: deviation approved
Route::post('reports/summary', [ReportController::class, 'summary']);
```

## Exceptions
When all four costs are "no" — the deviation is cost-free and should proceed. This is rare but possible (e.g., synonyms or aliases).

## Consequences Of Violation
Deviations approved without cost assessment; cumulative complexity from unmeasured costs; clients bearing the burden of special handling; tooling and documentation gaps.
---

## Codify Common Deviations In The Style Guide
---
## Category
Code Organization
---
## Rule
Always document accepted common deviations in the API style guide — never let each developer independently decide whether to deviate from REST conventions.
---
## Reason
Without a style guide, each developer evaluates deviations independently, producing inconsistent decisions for the same scenario. One developer creates a POST search endpoint; another creates a GET with encoded query parameters for the same scenario. A style guide with codified deviations ensures team-wide consistency and provides a clear reference for code reviews.
---
## Bad Example
```php
// No style guide — each developer decides independently
// Dev A: POST for complex search
Route::post('orders/search', [OrderController::class, 'search']);
// Dev B: GET for complex search (different endpoint, same complexity)
Route::get('products/search', [ProductController::class, 'search']);
// Inconsistent patterns for the same problem
```

## Good Example
```php
// Style guide rule: "All search endpoints with 5+ filter parameters use POST /search"
// Consistent application:
Route::post('orders/search', [OrderController::class, 'search']);
Route::post('products/search', [ProductController::class, 'search']);
```

## Exceptions
Novel scenarios not covered by the style guide. Add them to the guide after the first approved deviation rather than letting each team member decide independently.

## Consequences Of Violation
Inconsistent deviation decisions across the API; style guide becomes irrelevant as decisions are made ad-hoc; code reviews lack objective criteria for approving/rejecting deviations.
---

## Accept That Some Operations Are Actions
---
## Category
Architecture
---
## Rule
Always accept that some domain operations cannot be naturally expressed as CRUD — use action endpoints with clear naming instead of force-fitting complex operations into unnatural resource abstractions.
---
## Reason
Force-fitting operations into CRUD produces unnatural abstractions: "send invoice" becomes PATCH `/invoices/{id}` with `{status: "sent"}`, hiding the emailing, PDF generation, and logging side effects. Action endpoints (`POST /invoices/{id}/send`) make the operation explicit and allow the controller to encapsulate all side effects without abstraction leakage.
---
## Bad Example
```php
// Force-fitting "send invoice" into PATCH
Route::patch('invoices/{invoice}', [InvoiceController::class, 'update']);
public function update(Request $request, Invoice $invoice)
{
    $invoice->update(['status' => 'sent']); // hides side effects
    Mail::to($invoice->customer)->send(new InvoiceMail($invoice));
    Log::info('Invoice sent', ['id' => $invoice->id]);
}
```

## Good Example
```php
// Explicit action endpoint
Route::post('invoices/{invoice}/send', SendInvoiceController::class);
public function __invoke(Invoice $invoice)
{
    $invoice->send(); // encapsulates email, PDF, logging
    return new InvoiceResource($invoice);
}
```

## Exceptions
When the operation IS a simple state transition with no side effects (marking a notification as read). Use PATCH for these — action endpoints are for operations with side effects.

## Consequences Of Violation
Unnatural resource abstractions with hidden side effects; controllers with complex conditional logic for different "update" scenarios; documentation cannot accurately describe what each endpoint does.
---

## Review Deviations Quarterly
---
## Category
Maintainability
---
## Rule
Always review all REST deviations quarterly — remove deviations that are no longer justified as the API, client capabilities, or infrastructure evolves.
---
## Reason
Deviations approved at one point in time may become unnecessary as circumstances change. A POST-for-search deviation created because the query exceeded URL length limits may be unnecessary after upgrading to an API gateway with higher URL limits. A JSON-only content negotiation bypass may conflict with new XML client requirements. Regular reviews prevent deviation creep.
---
## Bad Example
```php
// Deviation from 2022 — still in place in 2026, no longer needed
// POST for search because URL limits — infrastructure now supports 8KB URLs
Route::post('users/search', [UserController::class, 'search']);
```

## Good Example
```php
// Q2 2026 review: URL limits resolved, migrated to GET
Route::get('users', [UserController::class, 'index']);
// GET /users?filter[name]=john&filter[email]=*@example.com&sort=-created_at
```

## Exceptions
Deviations that cannot be removed without breaking existing clients. Keep them but document the backward-compatibility requirement and add the REST-conformant endpoint alongside the deviation.

## Consequences Of Violation
Permanent deviation accumulation; API becomes increasingly RPC-like over time; each new team member adds deviations without reviewing existing ones; migration to RESTful design becomes prohibitively expensive.
---

## Set Different Purity Standards For External vs Internal APIs
---
## Category
Architecture
---
## Rule
Always apply higher REST purity standards to public/external APIs than to internal microservices — never use the same purity guidelines for both without differentiation.
---
## Reason
Public APIs have diverse, uncontrolled consumers who benefit from strict REST conventions (predictability, standard tooling, automatic caching). Internal APIs have a single controlled consumer (your frontend, another microservice) where pragmatism is less costly. Applying the same standard to both either over-engineers internal APIs or under-engineers public ones.
---
## Bad Example
```php
// Same standards for internal and external — over-engineered internal API
// Internal service with 1 consumer: full HATEOAS with action links
```

## Good Example
```php
// Public API: RESTful (Level 2), documented, full status code coverage
Route::prefix('v1/public')->group(function () {
    Route::apiResource('users', UserController::class);
});
// Internal API: pragmatic, single-consumer optimized
Route::prefix('v1/internal')->group(function () {
    Route::post('bulk-sync', [SyncController::class, 'bulkSync']);
});
```

## Exceptions
When the same API serves both internal and external consumers. Use a gateway layer to apply different standards externally while keeping the internal API pragmatic.

## Consequences Of Violation
Over-engineered internal APIs with unnecessary complexity; under-designed public APIs with poor developer experience; inconsistent resource allocation — too much effort on internal endpoints, too little on external ones.
---
