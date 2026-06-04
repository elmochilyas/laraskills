# conditional-field-inclusion
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** conditional-field-inclusion  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Conditional field inclusion controls which resource attributes appear in API responses based on runtime conditions. Laravel's resource methods `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`, and `whenExistsInRequest()` enable developers to conditionally include or exclude fields, reducing response payload, avoiding null leakage, and preventing 500 errors from undefined array keys. This is essential for building flexible resources that serve multiple client types from a single definition.

## Core Concepts
- **`when($condition, $value)`**: Returns `$value` only when `$condition` is truthy. When falsy, the key is omitted from the response entirely.
- **`whenHas($attribute)`**: Includes the attribute only if it exists on the underlying model and is not null. Avoids returning null values for fields the model doesn't have.
- **`whenNotNull($value)`**: Includes the attribute only when the value is not null. Useful for computed values that may be null.
- **`mergeWhen($condition, $array)`**: Merges an associative array into the output only when the condition is true.
- **`whenExistsInRequest($key)`**: Includes the attribute only if the given key is present in the request. Enables client-requested fields.
- **`unless($condition, $value)`**: The inverse of `when()` — includes the value when the condition is falsy.
- **Key Omission vs. Null**: When a condition is false, the key is omitted from the JSON output entirely. This is different from returning `null` for the key.

## Mental Models
- **Stage Light**: Conditional inclusion is a stage light that illuminates only certain actors (fields). Unlit actors are invisible (omitted), not present but dark.
- **Selective Disclosure**: Like a selective disclosure ID card — only reveal specific attributes based on who's asking.
- **Filter Function**: Think of each field as passing through a filter that either passes it through or drops it. Dropped fields don't appear in the output at all.

## Internal Mechanics
- **`Resource::toArray()` Return Processing**: The resource base class processes the array returned by `toArray()`. Any key-value pair where the value is a `ConditionallyLoadsAttributes` instance is evaluated lazily.
- **`ConditionallyLoadsAttributes` Trait**: This trait provides `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`, and `whenExistsInRequest()` as methods that return `Conditional` or `MergeValue` instances.
- **Evaluation Timing**: The conditional evaluation happens inside `ResourceResponse::toResponse()`, which calls a finalize method that resolves all `Conditional` instances.
- **`Conditional` Object**: A lightweight object that holds the condition and the value. During serialization, the condition is evaluated, and the key-value pair is either included or excluded.
- **Array-to-JSON Mapping**: PHP's `json_encode` automatically omits keys from the final output when the key was never added to the array, which is how conditional omission works.

## Patterns
- **Role-Based Field Inclusion**: Use `when(auth()->user()->isAdmin(), ...)` to expose sensitive fields (internal notes, financial data) only to authorized roles.
- **Load-Aware Field Inclusion**: Combine `when($this->relationLoaded('profile'))` with `whenHas()` to only include profile data when already loaded. Avoids N+1 queries.
- **Appends-Based Inclusion**: Conditionally include model appends that are expensive to compute: `when($this->shouldAppend('full_text_preview'))`.
- **Request-Driven Field Selection**: Use `whenExistsInRequest('fields')` to allow clients to request specific fields per request (ad-hoc sparse fieldsets).
- **Environment-Aware Inclusion**: Include debug fields (query time, memory usage) only in non-production environments: `when(! app()->isProduction(), ...)`.
- **Merged Conditional Fields**: Use `mergeWhen()` to conditionally include a block of related fields, avoiding repetitive `when()` calls.

## Architectural Decisions
- **Omission vs. Null**: Decide whether missing fields should be omitted entirely or sent as explicit null. Omission reduces payload but can confuse clients that expect the key to exist. Null preserves the key contract but increases size.
- **Condition Location**: Decide whether conditions live in the Resource class (common) or are determined externally via a policy/service. Inline conditions are simpler but harder to test in isolation.
- **Caching Conditional Responses**: Responses that vary by user role or request parameters must use cache keys that reflect those variances, or bypass caching entirely.
- **Client-Defined Fields**: Exposing `whenExistsInRequest()` to clients is powerful but adds complexity. Clients must know which fields are available.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Reduced payload per client type | Conditional logic in resources is harder to test | Every code path through `when()` is a test case |
| No null leakage to clients | Conditional methods obscure the full response shape | New team members must trace conditions to understand output |
| Role-based field security | Response caching becomes role-dependent | Different roles cannot share cached responses |
| N+1 prevention via load-aware inclusion | Load-checking adds coupling between controller and resource | Controller must eager-load for resource to include fields |
| Client-requested fields reduce over-fetching | Client field selection adds API complexity | Documentation must list available fields per resource |

## Performance Considerations
- **Condition Evaluation Cost**: Each `when()` call is a closure or boolean check. Hundreds of `when()` calls per resource add up. Pre-compute conditions when possible.
- **Eloquent Relation Loading Check**: `$this->relationLoaded('x')` is a fast property check on the model's relations array. It does not trigger a database query.
- **Serialization Bypass**: When conditions are false, the serialized output is smaller. Conditional inclusion that omits 50% of fields produces measurably smaller responses.
- **Caching Fragmentation**: Too many condition variants fragment the cache. Each unique combination of conditions creates a distinct cached response.

## Production Considerations
- **Testing Coverage**: Write resource tests that assert field presence for each condition state. A missing `when()` condition causes a silent field omission.
- **Monitoring Omitted Fields**: If a critical field is accidentally omitted due to a false condition, the client receives no error — the field is just missing. Monitor for client-side field-not-found errors.
- **Documentation Generation**: API documentation generators (Scribe, Swagger) may struggle to document conditional fields. Provide manual examples for each condition variant.
- **Condition Explosion**: As the API grows, the number of conditional branches multiplies. Establish a policy for when conditions are acceptable vs. when a separate resource should be created.

## Common Mistakes
- **Returning `when()` Outside the Return Array**: Calling `$this->when(...)` outside of the `toArray()` return statement breaks the condition mechanism. It must be a value in the returned array.
- **Forgetting `whenNotNull()`**: Returning `'field' => $nullableValue` always includes the key, even when null. Use `whenNotNull()` to omit null fields.
- **Using `when()` for Non-Existent Model Attributes**: `when($this->attr)` silently returns false if the attribute doesn't exist on the model, but doesn't throw an error. The field is silently omitted.
- **Nested Conditional Confusion**: Using `when()` inside a nested array returned from `toArray()` — conditionals are only resolved at the top level of the resource. Nested conditionals must be handled explicitly.
- **Overusing `when()`**: Wrapping every field in `when()` makes resources unreadable. Use `when()` only for fields that genuinely change per response context.

## Failure Modes
- **Silent Field Omission**: A condition that is always false causes the field to never appear. The client never complains because the field was never documented as guaranteed.
- **Role Escalation via Cache**: If conditional fields vary by role but the response is cached for a privileged role, lower-privilege users may receive privileged data from cache.
- **Broken `whenHas()` on Loaded Relations**: `whenHas('relation.field')` works only when the relation is loaded. If not loaded, the method doesn't lazy-load — it silently returns false.
- **Conditional Merge Overlap**: Using `mergeWhen()` to conditionally include fields that are also included unconditionally elsewhere causes duplicate key warnings or overwrites.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Resources\Json\JsonResource` uses the `ConditionallyLoadsAttributes` trait. The trait provides all conditional methods.
- **Spatie/laravel-query-builder**: Spatie's package uses `when()` internally to conditionally append query parameters and includes.
- **Laravel Nova**: Nova uses conditional field inclusion extensively in its resource responses, including fields based on authorization, resource state, and request parameters.
- **JSON:API Sparse Fieldsets**: Conditional inclusion is the mechanism underlying JSON:API sparse fieldsets — fields are conditionally omitted based on the `fields[]` query parameter.

## Related Knowledge Units
### Prerequisites
- envelope-response-design

### Related Topics
- conditional-relationship-inclusion
- conditional-aggregate-inclusion
- sparse-fieldset-design

### Advanced Follow-up Topics
- json-api-resource-structure

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\Json\JsonResource` (uses `ConditionallyLoadsAttributes` trait)
- `Illuminate\Http\Resources\ConditionallyLoadsAttributes` (`when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`, `unless()`, `whenExistsInRequest()`)
- `Illuminate\Http\Resources\Json\ResourceResponse` (conditional evaluation in `toResponse()`)

### Key Insight
Conditional methods return `Conditional` or `MergeValue` proxy objects that are lazily resolved during `toResponse()` — they do not evaluate at `toArray()` time, enabling the resource to pass conditions through nested compositions unchanged.

### Version-Specific Notes
- Laravel 6+: Core conditional methods available since API Resources were introduced
- Laravel 10/11/12/13: `whenExistsInRequest()` added later; otherwise consistent across versions
- No breaking changes to conditional API between Laravel 10-13
