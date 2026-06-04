# ECC Anti-Patterns — Controller Dependency Injection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Dependency Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Request in Constructor (Stale State)
2. Service Locator Calls in Controller Methods
3. Constructor Bloat (6+ Dependencies)
4. FormRequest in Constructor (Wrong Validation Timing)
5. Unused Constructor Dependencies

---

## Repository-Wide Anti-Patterns

- Type-Hinting `Request` Instead of FormRequest for Store/Update
- Manual `Model::findOrFail($id)` Instead of Route Model Binding
- Single-Method Service Injected in Constructor
- No `private readonly` Promoted Properties
- Injecting Heavy Services Into Every Controller

---

## Anti-Pattern 1: Request in Constructor

### Category
Architecture | Security

### Description
Injecting `Illuminate\Http\Request` or any subclass via the controller constructor, capturing request state at instantiation time rather than dispatch time.

### Why It Happens
Developers want the request accessible to all methods without repeating the type-hint in each method signature.

### Warning Signs
- Constructor parameter typed `Illuminate\Http\Request`
- `$this->request->user()` returns null or stale data in some methods
- Authentication data is unavailable in methods where middleware hasn't run
- Debugging reveals request data changes between construction and method execution

### Preferred Alternative
Always use method injection for `Request`. Type-hint it in individual method signatures where request data is needed.

### Related Rules
- Rule: Never Inject Request in Controller Constructors
- Rule: Use Method Injection for Request-Specific Dependencies

---

## Anti-Pattern 2: Service Locator Calls in Controller Methods

### Category
Architecture | Testing

### Description
Using `app()->make()`, `resolve()`, or `App::make()` inside controller methods instead of declaring dependencies via constructor or method injection.

### Why It Happens
Developers are not aware of or do not use Laravel's dependency injection. They reach for the service container manually when they need a service.

### Warning Signs
- `app(UserService::class)` or `resolve(UserService::class)` in method body
- No constructor injection for services used across multiple methods
- Tests cannot mock dependencies without modifying controller code
- Hidden dependencies that are undocumented in the class signature

### Preferred Alternative
Declare all dependencies in the constructor (shared services) or method signature (per-method services). Remove all `app()->make()` calls.

### Related Rules
- Rule: Avoid Service Locator Calls in Controller Methods

---

## Anti-Pattern 3: Constructor Bloat (6+ Dependencies)

### Category
Maintainability | Architecture

### Description
A controller constructor with 6 or more injected dependencies, indicating the controller handles too many responsibilities.

### Why It Happens
The controller is used as the orchestrator for a complex workflow, with each step requiring a different service.

### Warning Signs
- Constructor has 7+ `private readonly` parameters
- Controller has 10+ public methods (god controller)
- Each method uses a different subset of the injected dependencies
- Adding a new feature requires adding another constructor parameter
- Constructor documentation lists more than 5 "dependencies"

### Preferred Alternative
Extract related operations into dedicated service classes. The controller should delegate to a single service that handles orchestration internally.

### Related Rules
- Rule: Limit Constructor Dependencies to a Reasonable Count (5 or fewer)

---

## Anti-Pattern 4: FormRequest in Constructor

### Category
Architecture | Security

### Description
Injecting a FormRequest class (`StoreUserRequest`, `UpdateUserRequest`) via the controller constructor instead of the method signature.

### Why It Happens
Developers treat FormRequests like any other service dependency, not realizing they must be validated at method-call time rather than construction time.

### Warning Signs
- `StoreUserRequest` or any FormRequest appears in constructor parameters
- Validation errors are not thrown before the method body executes
- FormRequest `authorize()` runs at construction time, potentially before the authenticated user is resolved
- `$this->request->validated()` returns unexpected results

### Preferred Alternative
Always inject FormRequests in the method signature. The framework validates them before the method body executes.

### Related Rules
- Rule: Use Method Injection for Form Requests
- Rule: Always Type-Hint FormRequest Instead of Request

---

## Anti-Pattern 5: Unused Constructor Dependencies

### Category
Maintainability | Performance

### Description
Injecting a service in the constructor that is only used by one method, forcing unnecessary resolution on every request to any method.

### Why It Happens
Developers default to constructor injection for all dependencies without considering usage scope. All dependencies are treated as "shared" by habit.

### Warning Signs
- A constructor-injected service is only referenced in one method
- Export, report, or admin-only services injected as constructor dependencies
- Controller has 4+ dependencies but each method only uses 1-2
- Tests must resolve heavy services even when testing simple `index` or `show` methods

### Preferred Alternative
Use method injection for dependencies used by only one method. Keep constructor injection for services used by 2+ methods.

### Related Rules
- Rule: Use Method Injection for Single-Method Dependencies
- Rule: Use Constructor Injection for Shared Service Dependencies
