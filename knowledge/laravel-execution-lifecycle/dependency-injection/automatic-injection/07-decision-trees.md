# Decision Trees — Automatic Injection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-04: Automatic Injection |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Rely on Auto-Resolution vs Explicit Binding | Whether to let the container auto-resolve or register an explicit binding | Every dependency | Medium |
| D02 | Automatic Injection Failure Recovery | How to fix resolution when auto-resolution fails | Troubleshooting | High |
| D03 | Optional vs Required Dependencies | Whether a constructor dependency should be optional (nullable) or required | Every constructor parameter | Medium |

---

## D01: Rely on Auto-Resolution vs Explicit Binding

### Decision Context
A class needs to be resolved from the container. The container can either auto-resolve it (Reflection-based) or use an explicit binding.

### Criteria
1. **Class type**: Is the target class concrete, abstract, or an interface?
2. **Dependency stability**: Are the constructor dependencies stable or likely to change?
3. **Resolution frequency**: Is this class resolved on every request (hot path)?
4. **Construction cost**: Does the class have complex construction logic?

### Decision Tree
```
Class or interface needing resolution
├── Is it an interface or abstract class?
│   ├── Yes → MUST use explicit binding (auto-resolution cannot instantiate)
│   └── No → Is it a concrete class?
│       ├── Yes → Does the constructor have primitive parameters without defaults?
│       │   ├── Yes → MUST use explicit binding or add defaults
│       │   └── No → Is this resolved on every request?
│       │       ├── Yes → Consider explicit singleton binding (avoids per-request Reflection)
│       │       └── No → Auto-resolution is fine (no binding maintenance needed)
│       └── No → (not reachable — every class is concrete, abstract, or interface)
```

### Rationale
Auto-resolution is a convenience that works for concrete classes with resolvable dependencies. The tradeoff is per-call Reflection overhead (~0.01-0.05ms per `make()`). For hot paths, explicit singleton bindings bypass this cost. For interfaces and abstract classes, auto-resolution is impossible — they require explicit bindings.

### Default
Auto-resolve concrete classes on cold paths. Explicit singleton on hot paths. Always bind interfaces and abstract classes.

### Risks
- Hot path auto-resolution = cumulative Reflection overhead across many requests.
- Concrete constructor change = auto-resolution may silently break if new deps are not resolvable.
- Auto-resolution for interfaces = `TargetInterfaceNotInstantiableException`.

### Related Rules/Skills
- Skill: Automatic Injection

---

## D02: Automatic Injection Failure Recovery

### Decision Context
Auto-resolution has failed (thrown an exception). You need to diagnose and fix the issue.

### Criteria
1. **Exception type**: `BindingResolutionException`, `TargetInterfaceNotInstantiableException`, or another?
2. **Parameter type**: Is the failing parameter a class type, interface, or primitive?
3. **Binding existence**: Is there a registered binding for the type?
4. **Default value**: Does the parameter have a default?

### Decision Tree
```
Auto-resolution exception thrown
├── Is the exception TargetInterfaceNotInstantiableException?
│   ├── Yes → Parameter type-hints an interface or abstract class without binding
│   │   └── Fix: Register binding in service provider
│   └── No (BindingResolutionException) → Check the failing parameter:
│       ├── Is it a primitive type (string, int, array, bool)?
│       │   ├── Yes → Container cannot auto-resolve primitives
│       │   │   └── Fix: Add default value, explicit binding, or contextual binding
│       │   └── No → Is it a class type?
│       │       ├── Yes → Does that class's constructor have unresolvable deps?
│       │       │   ├── Yes → Fix the dependency chain recursively
│       │       │   └── No → Check if the class exists and is autoloadable
│       │       └── No → (not reachable)
├── Is the exception a recursive resolution timeout?
│   ├── Yes → Circular dependency detected (class appears twice in build stack)
│   └── Fix: Restructure classes to remove the cycle
```

### Rationale
Auto-resolution fails in predictable ways. Interfaces and abstract classes without bindings throw `TargetInterfaceNotInstantiableException`. Primitives without defaults or bindings throw `BindingResolutionException`. Circular dependencies cause infinite recursion until memory exhaustion. Each failure type has a specific fix.

### Default
Bind interfaces → provide defaults for primitives → restructure to remove circular deps.

### Risks
- Ignoring the exception by catching it = silent resolution failures downstream.
- Providing a meaningless default for a required dependency = subtle bugs.
- Restructuring to break a cycle without understanding the design issue = temporary fix.

### Related Rules/Skills
- Skill: Automatic Injection

---

## D03: Optional vs Required Dependencies

### Decision Context
A class needs a dependency, but it might not always be available. Should the dependency be optional (nullable with default) or required?

### Criteria
1. **Runtime availability**: Is the dependency always available at runtime?
2. **Alternative behavior**: Can the class function without the dependency?
3. **Binding guarantee**: Is there a guaranteed binding for this type?
4. **Error handling**: What should happen when the dependency is missing?

### Decision Tree
```
Constructor dependency with uncertain availability
├── Can the class function without this dependency (graceful degradation)?
│   ├── Yes → Make optional: ?Logger $log = null
│   │   └── Add null checks in methods that use it
│   └── No (class cannot function without it) → Make required: Logger $log
│       └── Ensure binding exists or type-hint a concrete class
├── Is there a guaranteed binding for the type?
│   ├── Yes → Required is safe (container will always resolve)
│   └── No → Is it an interface?
│       ├── Yes → Consider making optional (in case no binding is registered)
│       └── No (concrete) → Auto-resolution will handle it — required is safe
```

### Rationale
Optional dependencies (nullable + default null) allow the container to skip resolution when no binding exists. This is useful for logging, debug, or monitoring services that enhance functionality but aren't critical. Required dependencies make the contract explicit — the class cannot function without them. The choice depends on whether the class can degrade gracefully.

### Default
Required for core functionality. Optional for cross-cutting concerns (logging, metrics, debugging).

### Risks
- Making a critical dependency optional = silent failure mode (no logger = no error tracking).
- Making an optional dependency required = crashes when the binding is missing.
- Too many optional dependencies = class becomes hard to reason about (many null checks).

### Related Rules/Skills
- Skill: Automatic Injection
