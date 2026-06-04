# Anti-Patterns: Appends

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Appends

## Anti-Patterns

### Heavy Accessor in $appends
Running database queries or expensive computation inside an accessor listed in `$appends`. Every `toArray()` call invokes all appended accessors — for collection listings, this multiplies cost by the number of models.

**Problem:** Slow API responses; unexpected N+1 queries during serialization; collection endpoints become bottlenecks.

**Solution:** Cache expensive accessor results with instance caching (`$this->cached ??= compute()`). For very heavy computations, use API Resources with lazy evaluation.

### No Caching for Expensive Accessors
Recomputing the same expensive value multiple times on the same model instance without caching. Each serialization call re-executes the full computation.

**Problem:** Repeated expensive computation on the same instance; wasted CPU.

**Solution:** Cache the result with `$this->cachedValue ??= $this->computeValue()` inside the accessor.

### Using $appends When API Resources Would Be Cleaner
Adding accessors to models only for a single API endpoint's serialization needs. The model gains a permanent computed attribute that is only used in one HTTP context.

**Problem:** Model bloat; accessors added for presentation logic that should live at the HTTP layer.

**Solution:** Use API Resources with computed fields for endpoint-specific serialization.

### Append Dependency Chain
Append A calls append B calls append C — creating a fragile chain of dependent computed attributes. A change to any accessor in the chain can break downstream appends.

**Problem:** Fragile dependency graph; hard to debug; unexpected failures when any accessor in the chain changes.

**Solution:** Keep appended accessors independent. Extract shared computation into private methods each append can call independently.

### Appending Relationships Without Eager Loading
Listing an accessor in `$appends` that queries a relationship, without ensuring the relationship is eagerly loaded. Every serialization triggers a lazy load.

**Problem:** N+1 queries during serialization; slow collection responses.

**Solution:** Eager-load relationships used in appended accessors at the query site, or use `whenLoaded()` in API Resources instead.

### Missing Accessor for $appends Entry
Defining `$appends` with an attribute name that has no corresponding accessor method. Serialization throws a `BadMethodCallException`.

**Problem:** Runtime exceptions on serialization; broken API responses.

**Solution:** Verify that every entry in `$appends` has a matching accessor (`get{Name}Attribute` or fluent `Attribute::make()`).

### $appends on Every Listing Endpoint
Having heavy `$appends` on models returned in listing endpoints that serialize dozens or hundreds of models. Each model's accessors run, multiplying serialization cost.

**Problem:** Slow listing endpoints; unnecessary computation for fields not displayed in list views.

**Solution:** Use `setAppends([])` before serialization for listing endpoints, or use `->append()` at the query site instead of global `$appends`.
