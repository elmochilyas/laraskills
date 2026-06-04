# DTO Patterns Skills

## Skill: Create typed, immutable data transfer objects for application boundary serialization

### Purpose
Use Data Transfer Objects (DTOs) as typed, immutable contracts at application boundaries to decouple internal domain models from external serialization across API, queue, events, and CLI channels.

### When To Use
- Application boundaries where data enters or leaves (controllers, queue listeners, event subscribers)
- Multi-channel serialization where the same data goes to API, queue, broadcast, and CLI
- Strict type enforcement at domain boundaries — DTOs catch type errors at compile/analysis time
- Anti-corruption layer between Eloquent models and the rest of the application
- Contract documentation — the DTO class IS the contract for what data looks like

### When NOT To Use
- Deep inside domain logic where Eloquent models are appropriate
- For every internal method call — adds indirection without benefit in simple CRUD
- When API Resources alone suffice (HTTP-only serialization)
- As anemic domain models — DTOs are not substitutes for domain objects
- For prototype/exploratory phases where speed matters more than structure

### Prerequisites
- PHP 8.1+ for promoted constructor properties and readonly modifiers

### Inputs
- Eloquent model instance, request data array, or external data source

### Workflow
1. Create a DTO class as a plain PHP class (no framework base class)
2. Define constructor with `public readonly` promoted typed properties
3. Add `fromModel()` named constructor to centralize Eloquent→DTO mapping
4. Add `fromArray()` named constructor for request/input data
5. Add `toArray()` with explicit key names and date formats
6. Wrap lists in typed collection classes (e.g., `UserDTOCollection`)
7. Use DTOs at all application boundaries: controllers, queue jobs, events
8. Test `fromModel()` to catch serialization drift when model columns change

### Validation Checklist
- [ ] DTOs are used at all application boundaries (controllers, queue, events)
- [ ] DTOs have no business logic — strictly data transfer
- [ ] `fromModel()` is tested and updated when model columns change
- [ ] DTO properties use `readonly` for immutability
- [ ] DTO constructor uses promoted properties (PHP 8.1+)
- [ ] Relationships used in DTO mapping are eager-loaded
- [ ] DTO serialization is tested (round-trip: model → DTO → array)
- [ ] DTOs do NOT extend Eloquent Model or use Eloquent traits
- [ ] No DTOs are created for models that never cross application boundaries

### Common Failures
- Adding business logic methods to DTOs — they become anemic domain models
- Making DTOs mutable — defeats snapshot contract purpose
- Using DTOs internally everywhere — adds unnecessary indirection
- Forgetting to update `fromModel()` when model columns change
- Returning Eloquent models directly from services instead of DTOs
- Creating DTOs for every internal method call

### Decision Points
- **DTO or API Resource?** — Use DTOs for multi-channel (API + queue + events); use Resources for HTTP-only
- **DTO or both?** — Use both when you need typed domain contracts (DTOs) plus HTTP-specific features (Resources)

### Performance Considerations
- DTO creation is lightweight (constructor + property assignment)
- DTO serialization is faster than Eloquent `toArray()` — no accessor resolution
- Mapping large collections via `array_map` + DTO constructor is efficient
- DTOs can be cached/serialized for reuse across processes
- Profile before adding DTO layer in hot serialization paths

### Security Considerations
- DTOs prevent Eloquent lazy loading from leaking into serialization
- DTOs cannot accidentally expose hidden attributes — only explicitly mapped data
- DTOs are immutable after creation — no mutation-based data leaks
- Input DTOs provide type safety against type-juggling attacks

### Related Rules
- [DTO-At-Every-Boundary](../dto-patterns/05-rules.md)
- [DTO-Readonly-Properties](../dto-patterns/05-rules.md)
- [DTO-No-Business-Logic](../dto-patterns/05-rules.md)
- [DTO-FromModel-Named-Constructor](../dto-patterns/05-rules.md)
- [DTO-No-Eloquent-Extension](../dto-patterns/05-rules.md)
- [DTO-Test-FromModel](../dto-patterns/05-rules.md)
- [DTO-Promoted-Constructor-Properties](../dto-patterns/05-rules.md)
- [DTO-Independent-Serialization-Format](../dto-patterns/05-rules.md)
- [DTO-No-Internal-Method-DTOs](../dto-patterns/05-rules.md)
- [DTO-Use-Collections-For-Lists](../dto-patterns/05-rules.md)

### Related Skills
- Create typed data contracts using spatie/laravel-data

### Success Criteria
- DTO is immutable (all properties readonly)
- `fromModel()` maps all expected properties correctly
- `toArray()` produces correct output shape
- DTO works across API + queue + events without modification
- Tests catch column renames in the underlying Eloquent model
