# Decision Trees — Auto-Resolution Strategy

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Auto-Resolution Strategy |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Auto-Resolution vs Explicit Binding | Whether to let the container auto-resolve or register an explicit binding | Every dependency | Medium |
| D02 | Reflection Cost Mitigation | How to reduce the performance impact of Reflection-based auto-resolution | Performance optimization | Medium |
| D03 | Auto-Resolution Failure Recovery | How to diagnose and fix when auto-resolution throws an exception | Troubleshooting | High |

---

## D01: Auto-Resolution vs Explicit Binding

### Decision Context
A class needs to be resolved. Should auto-resolution handle it or should you register an explicit binding?

### Criteria
1. **Class type**: Concrete class or interface/abstract?
2. **Resolution frequency**: How often is this class resolved?
3. **Constructor complexity**: Does it have primitives without defaults?
4. **Implementation control**: Do you need to specify which concrete to use?

### Decision Tree
`+` Class needing resolution
`+--` Is it an interface or abstract class?
    `+--` Yes -> MUST register explicit binding
    `+--` No -> Is it a concrete class with primitives without defaults?
        `+--` Yes -> MUST register explicit binding or add defaults
        `+--` No -> Is this on a hot path (resolved every request)?
            `+--` Yes -> Register explicit singleton (avoid per-request Reflection)
            `+--` No -> Auto-resolution is fine

### Rationale
Auto-resolution is a convenience for concrete classes with resolvable dependencies. For interfaces and abstract classes, it fails at runtime with TargetInterfaceNotInstantiableException. For hot paths, the Reflection overhead (~0.01-0.05ms per make()) adds up. Explicit singleton bindings bypass this cost.

### Default
Auto-resolve concrete classes with simple constructors. Explicit binding for interfaces, primitives, and hot paths.

### Risks
- Interface without binding = TargetInterfaceNotInstantiableException.
- Hot path auto-resolution = cumulative Reflection overhead.
- Constructor change can silently affect auto-resolution.

### Related Rules/Skills
- Skill: Auto-Resolution Strategy

---

## D02: Reflection Cost Mitigation

### Decision Context
A class resolved via auto-resolution is on a hot path. How do you reduce the Reflection overhead?

### Criteria
1. **Hit rate**: How many times per request is this class resolved?
2. **Chain depth**: How deep is the dependency chain?
3. **Singleton eligibility**: Can the class be a singleton (stateless)?
4. **Factory pattern**: Would a factory help cache the resolution?

### Decision Tree
`+` Hot path class using auto-resolution
`+--` Is the class stateless?
    `+--` Yes -> Register as singleton (Reflection cost paid once)
    `+--` No -> Can sub-dependencies be pre-resolved as singletons?
        `+--` Yes -> Pre-resolve sub-dependencies (breaks chain depth)
        `+--` No -> Accept the cost

### Rationale
The most effective mitigation is converting to singleton. For stateful classes, pre-resolving stateless sub-dependencies reduces chain depth. The overhead is generally acceptable for most applications (<1ms total bootstrap time).

### Default
Register hot-path classes as singletons. Pre-resolve stateless sub-dependencies.

### Risks
- Making a stateful class a singleton = data leakage between consumers.
- Over-optimizing before profiling = premature optimization.

### Related Rules/Skills
- Skill: Auto-Resolution Strategy

---

## D03: Auto-Resolution Failure Recovery

### Decision Context
Auto-resolution has thrown an exception. How do you diagnose and fix the issue?

### Criteria
1. **Exception type**: TargetInterfaceNotInstantiableException or BindingResolutionException?
2. **Failing parameter**: Is it an interface, primitive, or class with unresolvable deps?
3. **Resolution chain**: Is there a circular dependency?

### Decision Tree
`+` Auto-resolution exception
`+--` TargetInterfaceNotInstantiableException?
    `+--` Yes -> Interface/abstract without binding
    `+--` Fix -> Register explicit binding in service provider
`+--` BindingResolutionException?
    `+--` Is the failing parameter a primitive (string, int, array)?
        `+--` Yes -> Add default value or explicit binding
        `+--` No -> Does the parameter's class have unresolvable deps?
            `+--` Yes -> Trace and fix the dependency chain recursively
            `+--` No -> Check if the class exists and is autoloadable
`+--` CircularDependencyException?
    `+--` Fix -> Restructure classes to remove the cycle

### Rationale
Each exception type has a specific fix. Interfaces need bindings. Primitives need defaults or bindings. Circular dependencies need structural refactoring. Read the full exception message for the resolution chain.

### Default
Bind interfaces -> provide defaults for primitives -> restructure to remove cycles.

### Risks
- Catching the exception silently = resolution failures downstream.
- Providing meaningless defaults = subtle bugs.
- Not reading the full exception chain = repeating debugging steps.

### Related Rules/Skills
- Skill: Auto-Resolution Strategy
