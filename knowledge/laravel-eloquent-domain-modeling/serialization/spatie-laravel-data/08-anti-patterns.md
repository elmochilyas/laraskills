# Anti-Patterns: Spatie Laravel Data

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Spatie Laravel Data

## Anti-Patterns

### Business Logic in Data Classes
Adding methods that compute, validate business rules, or transform beyond simple casting to Data classes. Data classes should only define structure, casting, and input validation rules.

**Problem:** Business logic in the wrong layer; Data classes lose their focused purpose.

**Solution:** Keep Data classes strictly for data structure, type casting, and validation. Move business logic elsewhere.

### Data Class for Every Model
Creating a `Data` class for every Eloquent model, even those that never cross application boundaries. Unnecessary boilerplate for internal-only models.

**Problem:** Excessive file count; wasted development time; maintenance overhead without benefit.

**Solution:** Only create Data classes for models that cross application boundaries (API responses, queue jobs, events).

### No rules() on Input Data
Using `from()` with unvalidated request data on a Data class that has no `rules()` method defined. Invalid data passes through without validation.

**Problem:** Security risk — malformed data enters the system without validation.

**Solution:** Always define `rules()` on Data classes used for input. Validate before creating Data objects.

### Circular Nested Data
Data A contains Data B, which contains Data A — causing infinite recursion when calling `from()` or `toArray()`.

**Problem:** Infinite recursion; stack overflow; unrecoverable errors.

**Solution:** Test nested Data relationships for circular references. Break cycles with `Optional` or by restructuring.

### Over-Using Optional
Wrapping every property in `Optional` instead of using explicit nullable types. `Optional` should be used for partial updates — not as a default for all properties.

**Problem:** Reduced type safety; loss of explicit nullability contracts.

**Solution:** Use nullable types (`?string`) for properties that can be `null`. Reserve `Optional` for PATCH/update endpoints.

### Duplicating Validation Logic
Defining `rules()` on Data classes that duplicate Form Request validation. Two validation layers create inconsistency and maintenance burden.

**Problem:** Inconsistent validation rules; double validation overhead; harder to maintain.

**Solution:** Choose one validation layer. If using Data class `rules()`, skip Form Request validation for those endpoints.

### Ignoring Custom Casters
Not registering custom casters for application-specific value objects (Money, Address, Slug). Data class `from()` fails with `Uncastable` exception for unsupported types.

**Problem:** Runtime exceptions; failed data creation from custom types.

**Solution:** Register custom casters in a ServiceProvider for all application-specific value objects.
