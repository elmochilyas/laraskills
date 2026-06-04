# Factory Method Alternatives — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | factory-method-alternatives |

## Rules

### Rule 1: Use named static factory methods for complex creation
When creating a model instance requires setup beyond simple property assignment (defaults, relationships, business rules), encapsulate it in a named static factory method on the model.

### Rule 2: Name factory methods to express intent
Factory method names must describe what is being created and why (e.g., `draftForCustomer()`, `expressFromCart()`), not how it's implemented.

### Rule 3: Factory methods create but don't persist
Factory methods return an unsaved model instance. The caller decides when to call `save()`. This allows inspection and modification before persistence.

### Rule 4: Keep factory methods free of external I/O
Factory methods must not call external services, APIs, or perform I/O. They construct in-memory model instances only.

### Rule 5: Replace scattered new Model() calls with factory methods
Search for `new Model()` followed by multiple property assignments and replace them with factory method calls to reduce duplication and centralize creation logic.
