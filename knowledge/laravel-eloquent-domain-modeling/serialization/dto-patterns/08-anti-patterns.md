# Anti-Patterns: DTO Patterns

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** DTO Patterns

## Anti-Patterns

### DTO as Domain Object
Adding business logic, validation rules, or persistence concerns to a DTO. DTOs should only carry data between layers — adding behavior turns them into anemic domain models.

**Problem:** Business logic in the wrong layer; DTOs lose their focused purpose; testing complexity.

**Solution:** Keep DTOs anemic — data transfer only. Move business logic to dedicated service or domain classes.

### No DTO at Boundaries
Returning Eloquent models directly from controllers or services, coupling internal model structure to external contracts. Model changes directly impact API consumers.

**Problem:** Internal model changes break external contracts; lazy loading leaks into serialization.

**Solution:** Convert to DTOs at application boundaries. Models should not cross the boundary layer.

### Mutable DTO
Allowing property changes after DTO creation. DTOs should be immutable snapshots — mutation defeats their contract purpose.

**Problem:** Shared DTO instances mutated across contexts; unpredictable state; data races.

**Solution:** Use `readonly` properties (PHP 8.1+) and constructor-only initialization.

### DTO Explosion
Creating a DTO for every internal method call instead of only at true application boundaries. Adds indirection without benefit.

**Problem:** Excessive boilerplate; unnecessary indirection; slower development.

**Solution:** Use DTOs only at application boundaries (controllers, queue, events, API). Internal layers can use models or simple arrays.

### DTO Serialization Coupling
Hardcoding Eloquent date format or key casing conventions in DTO `toArray()`. The DTO becomes coupled to Eloquent's output format.

**Problem:** DTO tied to Eloquent conventions; cannot be used with other data sources.

**Solution:** Define DTO serialization independently from Eloquent's format. Use named constructors to decouple.

### Forgetting to Update fromModel()
Adding or renaming columns on an Eloquent model without updating the DTO's `fromModel()` method. The DTO silently omits or errors on the changed data.

**Problem:** Missing data in serialized output; runtime errors from undefined properties.

**Solution:** Test DTO creation from models to catch serialization drift when model columns change.

### DTO as Query Object
Putting query logic (Eloquent queries, repository calls) inside a DTO. DTOs carry data — queries belong in repositories or services.

**Problem:** Query logic in the wrong layer; DTOs become coupled to the database.

**Solution:** Keep DTOs pure data containers. Perform queries in services/repositories, then map results to DTOs.
