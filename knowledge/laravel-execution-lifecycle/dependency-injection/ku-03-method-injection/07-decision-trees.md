# Decision Trees — Method Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-03: Method Injection |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Method Injection vs Constructor Injection | Whether to inject a dependency at the method level or constructor level | Every method with dependencies | High |
| D02 | Container::call() Explicit Parameters vs Resolution | Whether to provide parameter values explicitly or rely on container resolution | Every call() invocation | Medium |
| D03 | Method Injection in Controller Actions | Which dependencies belong in controller action method signatures | Controller design | Medium |

---

## D01: Method Injection vs Constructor Injection

### Decision Context
A method needs a dependency. Should it be injected via method parameters or the class constructor?

### Criteria
1. **Usage scope**: Is the dependency used in this method only or across multiple methods?
2. **Reflection cost**: Is this method called frequently (hot path)?
3. **Class lifecycle**: Is the class constructed by the container?
4. **Serialization**: Is the class serialized (queued jobs)?

### Decision Tree
```
Method needs a dependency
├── Is the dependency used in only this method (not others)?
│   ├── Yes → Is the method called frequently (>1000 requests/sec)?
│   │   ├── Yes → Prefer constructor injection (avoid per-call Reflection overhead)
│   │   └── No → Method injection is appropriate (keeps constructor lean)
│   └── No (used in multiple methods) → Constructor injection (DRY, consistent)
├── Is the method a middleware handle()?
│   ├── Yes → Must use constructor injection (handle() signature is fixed to $request, $next)
│   └── No → Normal rules apply
├── Is the method a queued listener's handle()?
│   ├── Yes → Method injection for non-serializable services (event is serialized separately)
│   └── No → Normal rules apply
```

### Rationale
Method injection is ideal for single-use dependencies — it avoids cluttering the constructor with services only one method needs. However, `Container::call()` uses Reflection on every invocation, which adds ~10-50µs per call. On hot paths, moving frequently-used method-injected dependencies to the constructor eliminates this per-call Reflection overhead.

### Default
Method injection for single-use dependencies on non-hot paths. Constructor injection for shared dependencies or hot paths.

### Risks
- Method injection on hot paths = cumulative Reflection overhead.
- Same dependency injected across many methods = should be constructor injection.
- Method injection in middleware `handle()` = breaks the fixed signature contract.

### Related Rules/Skills
- Skill: Method Injection

---

## D02: Container::call() Explicit Parameters vs Resolution

### Decision Context
You are calling `Container::call()` to invoke a callable with method injection. You need to decide which parameters to provide explicitly (via the `$parameters` array) and which to let the container resolve automatically.

### Criteria
1. **Parameter type**: Is it a class type (container-resolvable) or a primitive (string, int, array)?
2. **Override necessity**: Do you need to override a type-hinted dependency with a specific instance?
3. **Runtime data**: Is this parameter value known only at call time?
4. **Default values**: Does the parameter have a default value?

### Decision Tree
```
Parameter for Container::call()
├── Is the parameter a class/interface type-hint (container-resolvable)?
│   ├── Yes → Do you need to override it with a specific instance?
│   │   ├── Yes → Pass the specific instance in $parameters array
│   │   └── No → Let the container resolve it automatically
│   └── No (primitive: string, int, array, bool) → Does it have a default value?
│       ├── Yes → Let the default handle it unless you need a different value
│       └── No → MUST provide value in $parameters array (container cannot resolve primitives)
├── Is the parameter a runtime value (request data, user input)?
│   ├── Yes → Pass in $parameters array
│   └── No → Container resolution is fine
```

### Rationale
`Container::call()` resolves type-hinted classes automatically and falls back to parameter defaults for primitives. Only primitives without defaults and override-specific instances need to be in the `$parameters` array. Overusing explicit parameters defeats the purpose of auto-resolution; under-using them causes `BindingResolutionException` for unresolvable primitives.

### Default
Let the container resolve all class-typed parameters. Only provide primitives without defaults and specific override instances in the `$parameters` array.

### Risks
- Forgetting to provide a primitive without default = `BindingResolutionException`.
- Providing an explicit value for a type the container would have resolved correctly = unnecessary overhead.
- Parameter name mismatch: `$parameters` array keys must match parameter names exactly.

### Related Rules/Skills
- Skill: Method Injection

---

## D03: Method Injection in Controller Actions

### Decision Context
You are writing a controller action method and need to decide which dependencies should be injected as method parameters.

### Criteria
1. **Dependency type**: Is it a framework service (Request), a route parameter, or a domain service?
2. **Usage scope**: Is this dependency specific to this action or used across many actions?
3. **Serialization**: (not applicable for controllers — they are not serialized)
4. **Testability**: Would method injection make the action easier to unit test?

### Decision Tree
```
Controller action method signature
├── Is it a Route parameter (implicit binding from URL)?
│   ├── Yes → MUST be a method parameter (route parameters are resolved by the router)
│   └── No → Is it the Request object?
│       ├── Yes → Method injection is idiomatic (action-specific, auto-resolved)
│       └── No → Is it a domain service used only in this action?
│           ├── Yes → Method injection (keeps controller constructor lean)
│           └── No → Is it a domain service used across multiple actions?
│               ├── Yes → Constructor injection (shared dependency, avoid repetition)
│               └── No → Method injection
```

### Rationale
Controller actions have a natural injection point — the method signature. Route parameters and Request are always method-injected. Domain services specific to one action should also be method-injected to keep the constructor clean. Shared services (repositories, loggers) belong in the constructor.

### Default
Route parameters and Request → method injection. Shared domain services → constructor injection. Action-specific services → method injection.

### Risks
- Constructor injection for action-specific services = unnecessary instantiation on unrelated actions.
- Method injection for shared services = repetitive signatures across actions.
- Too many method parameters = confusing action signatures.

### Related Rules/Skills
- Skill: Method Injection
- Skill: Constructor Injection
