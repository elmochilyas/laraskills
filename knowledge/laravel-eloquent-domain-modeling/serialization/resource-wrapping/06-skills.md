# Resource Wrapping Skills

## Skill: Configure API Resource wrapping strategy for consistent JSON response structure

### Purpose
Control whether serialized data is nested under a top-level key (`data`) or returned flat, using `$wrap`, `withoutWrapping()`, and custom `ResourceCollection` classes for consistent API response structure.

### When To Use
- Default behavior (single flat, collection wrapped) for most Laravel API projects
- `withoutWrapping()` globally for SPAs and frontend frameworks that expect flat responses
- `$wrap = 'data'` for consistent wrapping on both single and collection resources
- Custom `$wrap` key per resource type when API consumers need a named envelope
- Version-dependent wrapping to evolve API shape across versions

### When NOT To Use
- Using `withoutWrapping()` if API consumers depend on the `data` key for collections
- Setting `$wrap` on a resource that also returns manual wrapping in `toArray()` — double-wrapping
- Assuming `$wrap` affects collection resources — collections always use `data` hardcoded
- Changing wrapping strategy after public release without version negotiation

### Prerequisites
- Defined API Resource classes
- Project-wide decision on wrapping strategy

### Inputs
- Resource class with optional `$wrap` static property
- Application-level configuration in service provider

### Workflow
1. Decide wrapping strategy at project inception (flat vs wrapped) and document it
2. For flat responses, call `JsonResource::withoutWrapping()` in `AppServiceProvider::boot()`
3. For named envelope on single resources, set `public static $wrap = 'key'` on the resource class
4. For wrapped collections, accept the default `data` wrapping or customize via `ResourceCollection::toArray()`
5. Test wrapping structure for both single and collection responses
6. If changing strategy between versions, use separate resource classes per version

### Validation Checklist
- [ ] Wrapping strategy is documented and coded as a project standard
- [ ] Single and collection responses are consistent in their wrapping
- [ ] No resource has both `$wrap` and manual wrapping in `toArray()`
- [ ] Frontend team is aligned on the wrapping strategy
- [ ] Feature tests verify wrapping structure for all endpoint types
- [ ] `withoutWrapping()` is called in a service provider (documented location)
- [ ] API versioning strategy accounts for wrapping changes

### Common Failures
- Expecting `withoutWrapping()` to only affect collections — it affects all resources
- Setting `$wrap` on a resource but also calling `withoutWrapping()` — `withoutWrapping()` nullifies it
- Double-wrapping: resource returns `['data' => ['data' => [...]]]` when manual + automatic wrapping combine
- Assuming collection wrapping key can be changed via `$wrap` — collections always use `data`
- Changing wrapping strategy without versioning — breaks all consumers

### Decision Points
- **Flat or wrapped?** — Use flat for SPAs/frontend frameworks; use `data`-wrapped for JSON:API compliance
- **Per-resource custom $wrap?** — Only when different resource types need different envelope keys (rare; prefer consistency)
- **withoutWrapping() location?** — Always in a service provider, never per-resource or per-controller

### Performance Considerations
- Wrapping is a simple array merge operation — negligible performance cost
- `withoutWrapping()` removes one array level — slight reduction in response size
- For deeply nested resources, each level's wrapping behavior adds minor overhead

### Security Considerations
- Wrapping does not affect data visibility — only changes response structure
- Ensure the wrapping key (`data`, `user`, etc.) does not collide with attribute names
- `withoutWrapping()` does not bypass any security controls

### Related Rules
- [Wrapping-Decide-Early-And-Version](../resource-wrapping/05-rules.md)
- [Wrapping-Call-WithoutWrapping-In-Provider](../resource-wrapping/05-rules.md)
- [Wrapping-No-Manual-And-Auto-Double-Wrap](../resource-wrapping/05-rules.md)
- [Wrapping-Awareness-Collection-Uses-Data](../resource-wrapping/05-rules.md)
- [Wrapping-Test-Both-Single-And-Collection](../resource-wrapping/05-rules.md)
- [Wrapping-Never-Modify-At-Runtime](../resource-wrapping/05-rules.md)
- [Wrapping-WithoutWrapping-For-SPAs](../resource-wrapping/05-rules.md)
- [Wrapping-Data-Attribute-Collision](../resource-wrapping/05-rules.md)
- [Wrapping-Align-With-Versioning](../resource-wrapping/05-rules.md)

### Related Skills
- Transform Eloquent models into structured JSON responses using API Resources

### Success Criteria
- Wrapping strategy is consistent across all endpoints
- Single resources are flat or wrapped according to project convention
- Collection resources use `data` key wrapping (or custom wrapping for named collections)
- No double-wrapping occurs
- Feature tests verify top-level response structure
