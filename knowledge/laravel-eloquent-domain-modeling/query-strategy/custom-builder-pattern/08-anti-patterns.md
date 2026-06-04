# Anti-Patterns: Custom Builder Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Custom Builder Pattern

## Anti-Patterns

### Builder for Every Model
Creating a custom builder for models with only 1-2 simple scopes. A custom builder is an abstraction that adds indirection. For models with few scopes, the model class itself or anonymous scopes are sufficient.

**Problem:** Unnecessary file overhead; reduced readability from indirection; team confusion about when to use builders vs scopes.

**Solution:** Create a custom builder only when the model has 5+ distinct custom query methods or scopes.

### God Builder
Creating one builder class for all models instead of per-model builders. A shared builder violates single responsibility and couples unrelated query logic.

**Problem:** Cross-model concerns mixed in one class; difficult to test, maintain, or suppress individual scopes.

**Solution:** Create per-model builder classes in `app/Models/Builders/`. Extract truly shared logic to traits consumed by multiple builders.

### Core Override
Overriding `where()`, `get()`, `first()`, or other core builder methods in a custom builder. This changes the behavior of every query on the model, including those generated internally by relationships and framework components.

**Problem:** Unexpected behavior in relationship queries; framework upgrades breaking custom logic; team members unaware that standard methods behave differently.

**Solution:** Use distinct method names for custom behavior. Never override core builder methods.

### Business Logic in Builder
Performing calculations, API calls, file I/O, or event dispatching inside builder methods. Builder methods should be limited to query construction only.

**Problem:** Unpredictable builder behavior; side effects triggered during query construction; testing complexity from mixed concerns.

**Solution:** Limit custom builder methods to adding WHERE clauses, JOINs, ORDER BY, and SELECT modifications. Business logic belongs in services, actions, or domain classes.

### Silent Registration
Defining a custom builder class but forgetting to register it with the model using `HasBuilder` trait or `newEloquentBuilder()` override. The custom builder class is never used.

**Problem:** All custom methods are unavailable; developer effort wasted; confusion when the intended builder behavior doesn't apply.

**Solution:** Always register the custom builder on the model immediately after creating the class. Verify registration with a simple test.

### Wrong Return Type
Declaring fluent custom builder methods without `: static` return type. Without it, IDE autocompletion reverts to the base `Builder` type, losing all custom method suggestions.

**Problem:** Broken IDE autocompletion after the first custom method call; developer frustration; reduced adoption of custom builder methods.

**Solution:** Declare all fluent custom builder methods with `: static` return type. Use explicit return types for methods that return non-builder types.
