# Decision Trees — Injection Guidelines by Class Type

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Injection Guidelines by Class Type |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Injection Strategy by Class Type | Which injection pattern to use for a given Laravel class type | Every new class | High |
| D02 | Queued Job Dependency Design | What should be constructor-injected vs method-injected in queued jobs | Every queueable job | High |
| D03 | Static Context Resolution | How to resolve dependencies when constructor injection is not available | Blade directives, facades, closures | Medium |

---

## D01: Injection Strategy by Class Type

### Decision Context
You are creating a new class and need to decide how dependencies should be injected based on the class type.

### Criteria
1. **Class type**: Controller, service, listener, job, middleware, command, etc.
2. **Resolution mechanism**: Is the class resolved by the container or manually?
3. **Method invocation**: Is the entry method called by the framework with method injection?
4. **Serialization**: Is the class serialized (queued)?

### Decision Tree
`+` New class created
`+--` Is it a Controller?
    `+--` Yes -> Constructor for shared deps, method for action-specific deps and Request
`+--` Is it a Service or Repository?
    `+--` Yes -> Constructor injection exclusively (never app())
`+--` Is it an Event Listener?
    `+--` Yes -> Method injection in handle() (not constructor)
`+--` Is it a Job?
    `+--` Yes -> Constructor for serialized data, handle() for runtime services
`+--` Is it Middleware?
    `+--` Yes -> Constructor injection for all deps
`+--` Is it an Artisan Command?
    `+--` Yes -> Constructor injection + handle() method injection
`+--` Is it a Service Provider?
    `+--` Yes -> Method injection in boot(), never resolve in register()
`+--` Is it a Blade Directive, Facade, or Route Closure?
    `+--` Yes -> app() or facades (constructor injection not available)

### Rationale
Each class type has an optimal injection pattern based on how the framework resolves and invokes it. Controllers need both patterns. Services always use constructor injection. Listeners use method injection because they are resolved per-event. Queued jobs split between serializable constructor deps and runtime-resolved handle() deps.

### Default
Consult the class-type table: constructor for shared/always-needed, method for action-specific/runtime-resolved.

### Risks
- Constructor injection in listener = deps resolved when registered, not when event fires.
- Heavy constructor deps in queued jobs = large serialized payload.
- app() in service classes = hidden dependencies.

### Related Rules/Skills
- Skill: Injection Guidelines by Class Type

---

## D02: Queued Job Dependency Design

### Decision Context
You are designing a queued job. Which dependencies should be in the constructor (serialized) and which in handle() (resolved at runtime)?

### Criteria
1. **Serializability**: Can the dependency be serialized (no Closures, no open connections)?
2. **Runtime freshness**: Does the dependency need to be current at execution time (not queue time)?
3. **Payload size**: How large is the dependency graph?
4. **Re-resolvability**: Is the dependency container-resolvable at the worker?

### Decision Tree
`+` Queued job dependency design
`+--` Is the dependency serializable (scalar, array, serializable object)?
    `+--` Yes -> Is it the data the job processes (payload, model ID)?
        `+--` Yes -> Constructor injection (the job payload)
        `+--` No -> Is it a service that should be fresh at execution time?
            `+--` Yes -> Method injection in handle() (resolved at worker)
            `+--` No -> Constructor injection is OK but may increase payload size
    `+--` No (non-serializable: Closure, DB connection, open resource) -> Method injection in handle()
        `+--` These deps are resolved fresh at the worker -> no serialization needed

### Rationale
Job constructor deps are serialized to the queue. Heavy service graphs increase payload size and may include non-serializable objects. Method injection in handle() resolves deps fresh at the worker, avoiding serialization issues and ensuring current state.

### Default
Constructor: job payload data (model IDs, scalar params). Handle(): runtime services (logger, mailer, repository).

### Risks
- Non-serializable service in constructor = queue failure.
- Heavy service graph in constructor = large queue payload.
- Missing service in handle() = dep not available at worker.

### Related Rules/Skills
- Skill: Injection Guidelines by Class Type

---

## D03: Static Context Resolution

### Decision Context
You are in a Blade directive, route closure, or other static context where constructor injection is not available. How should you access dependencies?

### Criteria
1. **Context type**: Blade directive, route closure, helper function, or facade?
2. **Frequency**: Is this called once or many times per request?
3. **Binding availability**: Is the service bound in the container?
4. **Testability**: Does the code need to be tested in isolation?

### Decision Tree
`+` Dependency needed in static context
`+--` Is this a Blade directive?
    `+--` Yes -> Use app() or resolve() helper inside the directive closure
        `+--` Cache the resolved instance if called frequently
`+--` Is this a route closure?
    `+--` Yes -> Type-hint the dependency in the closure parameters (Container::call() injection)
`+--` Is this a helper function?
    `+--` Yes -> Use app() inside the function body
`+--` Is this a custom Facade?
    `+--` Yes -> The facade root is resolved from the container (no direct app() call needed)

### Rationale
Static contexts (Blade directives, facades, helpers) lack constructor injection because they are not instantiated by the container. The app() helper or facade root provides access to services. For frequently-called static contexts, cache the resolved instance to avoid repeated container resolution.

### Default
app() for Blade directives and helpers. Type-hinted closure params for route closures.

### Risks
- Repeated app() calls in Blade directive called 1000x per page = performance impact.
- No type enforcement = runtime errors from wrong service type.
- Hidden dependencies = harder to trace service usage.

### Related Rules/Skills
- Skill: Injection Guidelines by Class Type
