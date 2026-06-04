# Resource Collection Skills

## Skill: Create custom collection classes with metadata for paginated list endpoints

### Purpose
Use `ResourceCollection` subclasses to wrap groups of models in API Resources with custom collection-level metadata, pagination controls, and controlled data structure.

### When To Use
- Any listing endpoint returning a collection of models wrapped in resources
- When you need pagination metadata (`links`, `meta`) alongside the data array
- When you need collection-level computed fields (aggregates, totals, counts)
- When you need custom pagination structure different from the default
- When you need to preserve original collection keys (`$preserveKeys`)

### When NOT To Use
- For single-item responses — use `Resource::make()` or `new Resource()`
- When you need different resource classes per-item within the same collection
- Using anonymous `Resource::collection()` if you need custom metadata — create a named collection class
- For non-HTTP serialization — use DTO collections or array mapping instead

### Prerequisites
- Defined item `JsonResource` class
- Eloquent collection or paginator

### Inputs
- Collection or paginator instance
- Optionally, item resource class via `$collects` property

### Workflow
1. Generate a collection class: `php artisan make:resource UserCollection --collection`
2. Set `public $collects = UserResource::class` to explicitly declare item resource
3. Define `toArray($request)` returning array with `'data' => $this->collection`
4. Add collection-level metadata in `with($request)` method (not inside `toArray()`)
5. Override `paginationInformation()` for custom pagination metadata format
6. For simple lists without custom metadata, use `Resource::collection($paginator)` directly
7. Always paginate collection endpoints — never unbounded `all()`

### Validation Checklist
- [ ] All collection endpoints are paginated (length-aware or cursor)
- [ ] Custom `ResourceCollection` classes declare `$collects` explicitly
- [ ] Pagination metadata format matches API documentation
- [ ] Collection tests cover both empty and populated states
- [ ] Paginated response includes `links` and `meta` keys
- [ ] Non-paginated response does not include pagination keys
- [ ] No unpaginated collection of unbounded size is exposed via API
- [ ] `$this->collection` is treated as read-only inside `toArray()`

### Common Failures
- Expecting `Resource::collection($paginator)` to differ from `new ResourceCollection($paginator)` — they are identical
- Overriding `toArray()` but forgetting to map items with `$this->collection`
- Not using `$collects` — relies on fragile naming convention
- Passing plain array instead of Collection or Paginator — method-not-found errors
- Modifying `$this->collection` inside `toArray()` — mutated wrapped state

### Decision Points
- **Named collection class or anonymous Resource::collection()?** — Use `Resource::collection()` for simple lists; create named subclass when you need custom metadata
- **Metadata in toArray or with?** — Collection-level metadata belongs in `with()`, not inside the `toArray()` data structure

### Performance Considerations
- Collection resources map each item individually — 10k items = 10k resource objects
- `paginationInformation()` calls `$paginator->toArray()` — cache if rendering same paginator multiple times
- `$preserveKeys` prevents re-indexing but surprises JSON consumers expecting sequential indices
- Custom `toArray()` runs once at collection level — negligible overhead

### Security Considerations
- Collection-level metadata in `with()` may leak internal information (total count with sensitive filters)
- `paginationInformation()` exposes current page and total count — ensure it doesn't violate data access policies
- Empty collections return `{"data": []}` — ensure this doesn't reveal resource type existence to unauthorized users
- Key preservation (`$preserveKeys`) may expose internal database IDs

### Related Rules
- [Collection-Always-Paginate](../resource-collection/05-rules.md)
- [Collection-Explicitly-Set-Collects](../resource-collection/05-rules.md)
- [Collection-No-PerItem-In-ToArray](../resource-collection/05-rules.md)
- [Collection-Metadata-In-With](../resource-collection/05-rules.md)
- [Collection-Graduate-From-Anonymous](../resource-collection/05-rules.md)
- [Collection-Test-Both-Shapes](../resource-collection/05-rules.md)
- [Collection-No-Mutate-Collection-Property](../resource-collection/05-rules.md)
- [Collection-PreserveKeys-Intentional](../resource-collection/05-rules.md)
- [Collection-Keep-Alongside-Item-Resource](../resource-collection/05-rules.md)
- [Collection-Handle-Empty-Correctly](../resource-collection/05-rules.md)

### Related Skills
- Return paginated resource responses with metadata

### Success Criteria
- Collection response includes `data` key with serialized items
- Paginated collections include `links` and `meta` keys
- Custom metadata appears at correct level (collection vs item)
- Empty collections return `{"data": []}` — not null or 404
- `$collects` is explicitly declared and correctly resolves item resource
