# Appends Skills

## Skill: Inject computed accessor values into serialization output using $appends

### Purpose
Use `$appends` to automatically include computed attribute values (from accessors) in a model's `toArray()` and `toJson()` output without manual per-instance addition.

### When To Use
- Computed display values needed in every serialization (full name, status label)
- Derived booleans or enums computed from model state (is_active, membership_tier)
- Formatting raw attributes for output (formatted_price, absolute_url)
- Computed values needed across multiple channels (API, queue, broadcast, notifications)

### When NOT To Use
- For heavy computation on frequently serialized models — use API Resources or cached values instead
- When the accessor queries a relationship (triggers N+1 on collection serialization unless eagerly loaded)
- For endpoint-specific computed values — use runtime `->append()` instead of global `$appends`
- As a substitute for real database columns — if the value is always needed, store it

### Prerequisites
- Defined accessor method matching each name in `$appends` array
- Relationships used in accessors must be pre-loaded at the query site

### Inputs
- Model instance with `$appends` property and matching accessor methods

### Workflow
1. Define the accessor method with `Attribute::make()->get()`
2. Add the accessor's snake_case name to `$appends`
3. For expensive accessors, cache with `$this->cached ??= compute()`
4. Type appended values with `$casts` for consistent JSON output
5. Use runtime `->append('field')` for endpoint-specific values instead of global `$appends`
6. Use `setAppends([])` before bulk export to disable unused appends
7. Protect sensitive appends with `$hidden`
8. Extract shared appends into reusable traits

### Validation Checklist
- [ ] All accessors referenced in `$appends` are defined on the model
- [ ] Expensive accessors use instance caching (`$this->cached ??= ...`)
- [ ] Accessors requiring relationships have those relationships eagerly loaded at call sites
- [ ] Listing endpoints are not serializing heavy `$appends` on every model
- [ ] Appended attributes are documented in API specs
- [ ] No append name collides with a database column name
- [ ] Sensitive appended attributes are hidden via `$hidden` or role-gated
- [ ] Appended values have matching `$casts` entries for type consistency

### Common Failures
- Missing accessor method — throws `BadMethodCallException` at serialization time
- N+1 from relationship queries in appended accessors on collections
- Name collision with database column — accessor silently never called
- Heavy computation on every serialization without caching
- Sensitive computed data exposed because it wasn't added to `$hidden`

### Decision Points
- **$appends vs runtime append()?** — Use `$appends` for values needed on every serialization path; use `->append()` for endpoint-specific values
- **Global $appends or API Resource?** — Use `$appends` for cross-channel serialization; use API Resources for HTTP-specific computed fields
- **Accessor caching?** — Always cache if the accessor performs computation, queries, or string building beyond simple concatenation

### Performance Considerations
- Each `toArray()` call invokes all accessors in `$appends` — N models × M appends = N×M accessor calls
- Cache expensive accessors with `$this->cached ??= compute()`
- Relationship queries in accessors require eager loading at call site to avoid N+1
- Use `setAppends([])` before bulk export to skip unnecessary accessor execution

### Security Considerations
- Appended attributes can expose computed data not intended for the client
- Apply `$hidden` to sensitive appended keys (risk scores, eligibility flags)
- Accessor exceptions crash the entire `toArray()` — handle errors gracefully
- Ensure appended accessors don't access unloaded relationships exposing unauthorized data

### Related Rules
- [Append-No-Relationship-Queries](../appends/05-rules.md)
- [Append-Cache-Expensive-Accessors](../appends/05-rules.md)
- [Append-Prefer-Runtime-For-Endpoint-Specific](../appends/05-rules.md)
- [Append-Accessor-Required](../appends/05-rules.md)
- [Append-No-Database-Writes-In-Accessor](../appends/05-rules.md)
- [Append-Type-With-Casts](../appends/05-rules.md)
- [Append-Disable-Before-Bulk-Export](../appends/05-rules.md)
- [Append-No-Column-Name-Collision](../appends/05-rules.md)
- [Append-Hide-Sensitive-Attributes](../appends/05-rules.md)
- [Append-Extract-Into-Traits](../appends/05-rules.md)

### Related Skills
- Inject hidden attributes into serialization output using $appends (this expands on per-skill file)

### Success Criteria
- Appended values appear in `toArray()` and `toJson()` output
- Expensive accessors are cached per-instance
- No N+1 queries from appended accessors on collection serialization
- Sensitive appended values are hidden from unauthorized consumers
- Appended values have consistent types in JSON output
