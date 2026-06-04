# Spatie Laravel Data Skills

## Skill: Create typed data contracts using spatie/laravel-data for structured serialization

### Purpose
Use `spatie/laravel-data` to create formalized Data Transfer Objects with automatic type casting, validation integration, nested data resolution, and extensible output transformers.

### When To Use
- Any project already using DTO patterns that wants to reduce boilerplate
- Applications needing automatic type casting and nested data object resolution
- Projects using Domain-Driven Design or Hexagonal Architecture with Laravel
- Multi-channel serialization where Data objects serve API, queue, broadcast, and CLI
- When you need validation integrated with the data structure itself

### When NOT To Use
- For simple CRUD APIs where API Resources already suffice
- When you only need HTTP-specific serialization — Resources are simpler
- In performance-critical hot paths where reflection overhead matters
- When the team is not familiar with DTO patterns — adds learning curve
- For models that never cross application boundaries

### Prerequisites
- Install `spatie/laravel-data` package
- PHP 8.1+ for promoted constructor properties and typed properties

### Inputs
- Eloquent models, request data, or arrays to transform into Data objects

### Workflow
1. Generate Data class: `php artisan data:make UserData`
2. Define promoted constructor properties with typed declarations
3. Add `rules()` method for input Data classes used with `from()`
4. Use `Optional` for PATCH/update endpoint fields (distinguish "not provided" from null)
5. Register custom casters and transformers in a service provider
6. Use `Data::collection()` for list returns instead of plain arrays
7. Cache Data configuration in production: `php artisan data:cache`
8. Test `fromModel()` to catch drift when Eloquent models change

### Validation Checklist
- [ ] Custom casters and transformers are registered in a ServiceProvider
- [ ] `rules()` method is defined on all Data classes used for input
- [ ] `Optional` is used for PATCH/update endpoints
- [ ] Data classes contain no business logic (strictly data)
- [ ] Reflection cache is cleared on deploy
- [ ] Nested Data relationships are tested for circular references
- [ ] `DataCollection` is used consistently for list endpoints
- [ ] Property casing convention (snake_case vs camelCase) is documented and followed
- [ ] No Data classes are created for models that never cross application boundaries

### Common Failures
- Not using `Optional` for partial updates — all fields are required by default
- Putting business logic in Data classes — they should be data-only
- Defining `rules()` that duplicate Form Request validation
- Forgetting to register custom casters — `from()` fails with `Uncastable` exception
- Using `from()` with unvalidated request data — security risk if `rules()` is not defined
- Circular nested data references — infinite recursion on `from()`

### Decision Points
- **Data class or plain DTO?** — Use spatie/laravel-data when you need automatic casting, validation integration, and nested data; use plain DTOs for simple typed contracts
- **Input Data or output-only Data?** — Add `rules()` for input Data; omit for output-only Data classes
- **Nullable or Optional?** — Use `Optional` for PATCH endpoints; use nullable for fields that can be legitimately null

### Performance Considerations
- Reflection-based type resolution is cached after first call per class
- Validation runs on every `from()` call if `rules()` is defined — avoid in hot paths
- `DataCollection` creation is linear — 10k items = 10k Data objects
- Serialization via `toArray()` is comparable to manual DTOs
- Custom transformers add overhead proportional to transformer count

### Security Considerations
- `from()` with `rules()` validates input, preventing malformed data entry
- Data objects are immutable after creation — no mutation-based data leaks
- Only explicitly defined properties are serialized — prevents accidental exposure
- Ensure `rules()` is defined on Data classes used for input — otherwise invalid data passes silently
- Custom casters should validate and sanitize input data during casting

### Related Rules
- [Spatie-Define-Rules-On-Input-Data](../spatie-laravel-data/05-rules.md)
- [Spatie-Optional-For-Partial-Update](../spatie-laravel-data/05-rules.md)
- [Spatie-No-Business-Logic](../spatie-laravel-data/05-rules.md)
- [Spatie-Register-Casters-In-Provider](../spatie-laravel-data/05-rules.md)
- [Spatie-No-Data-For-Internal-Models](../spatie-laravel-data/05-rules.md)
- [Spatie-Test-FromModel](../spatie-laravel-data/05-rules.md)
- [Spatie-Cache-In-Production](../spatie-laravel-data/05-rules.md)
- [Spatie-Avoid-Circular-Nested](../spatie-laravel-data/05-rules.md)
- [Spatie-Use-DataCollection-For-Lists](../spatie-laravel-data/05-rules.md)
- [Spatie-Consistent-Casing-Convention](../spatie-laravel-data/05-rules.md)

### Related Skills
- Create typed, immutable data transfer objects for application boundary serialization

### Success Criteria
- `Data::from()` correctly casts input types based on property declarations
- `fromModel()` maps all properties from Eloquent model correctly
- `rules()` validates input for Data classes used in controllers
- `Optional` fields correctly distinguish "not provided" from null
- Custom casters transform value objects correctly
- `DataCollection` produces correctly typed and serialized list output
- Configuration is cached in production
