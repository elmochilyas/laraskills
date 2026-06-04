# Anti-Patterns: Resource Wrapping

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resource Wrapping

## Anti-Patterns

### Inconsistent Wrapping Across Endpoints
Some resources have custom `$wrap`, others use defaults, creating an inconsistent API where consumers must handle multiple response shapes.

**Problem:** Inconsistent API contract; consumer confusion; increased integration complexity.

**Solution:** Decide on a wrapping strategy early and apply it consistently across all endpoints.

### Double Wrapping
A resource returns `['data' => ['data' => [...]]]` when manual wrapping in `toArray()` meets automatic wrapping from `$wrap` or collection defaults.

**Problem:** Nested response structure that consumers don't expect; broken API clients.

**Solution:** Check whether the resource has automatic wrapping enabled before adding manual `data` keys in `toArray()`.

### Changing Wrapping Strategy Without Versioning
Switching from wrapped to flat responses or vice versa without API versioning. Existing consumers break because they expect the old response shape.

**Problem:** Breaking change for all existing API consumers; production incidents.

**Solution:** Version the API and maintain different resource classes per version when changing wrapping strategy.

### Per-Instance $wrap Mutation
Modifying the static `$wrap` property at runtime on individual resource instances. Since `$wrap` is static, this affects all subsequent requests.

**Problem:** Race conditions; wrapping behavior changes for other requests; hard-to-debug side effects.

**Solution:** Configure `$wrap` declaratively on the resource class, never mutate at runtime.

### Assuming $wrap Affects Collections
Setting `$wrap` expecting it to change the wrapping key for collection responses. Collection wrapping always uses `data` (hardcoded in `ResourceCollection`).

**Problem:** Collection responses still wrapped in `data` despite custom `$wrap` — expectation mismatch.

**Solution:** Override `ResourceCollection::toArray()` for custom collection wrapping; `$wrap` only affects single resources.

### withoutWrapping Called Per-Resource
Calling `withoutWrapping()` on individual resource classes instead of once at the application level. This creates inconsistent behavior when some resources disable wrapping and others don't.

**Problem:** Some endpoints wrapped, others flat — inconsistent API.

**Solution:** Call `JsonResource::withoutWrapping()` once in `AppServiceProvider::boot()` for application-wide configuration.

### Resource with Data Attribute Collision
A model has an attribute named `data`, and collections wrap in `data` key. The attribute value collides with the wrapping key.

**Problem:** Attribute value overwritten by wrapping; data loss in serialized output.

**Solution:** Use a custom wrapping key or disable wrapping when a model has a `data` attribute.
