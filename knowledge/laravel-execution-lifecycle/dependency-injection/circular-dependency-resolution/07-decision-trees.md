# Decision Trees — Circular Dependency Resolution

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-09: Circular Dependency Resolution |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Structural Fix vs Lazy Resolution | Whether to refactor the class hierarchy or use lazy resolution to break a cycle | Every circular dependency | High |
| D02 | Detection Prevention | How to design classes to prevent circular dependencies from occurring | Architecture design | High |
| D03 | Cycle Diagnosis Strategy | How to trace and identify the source of a circular dependency | Troubleshooting | Medium |

---

## D01: Structural Fix vs Lazy Resolution

### Decision Context
A `CircularDependencyException` has been thrown. How should you resolve it?

### Criteria
1. **Cycle nature**: Is the cycle a genuine design issue or an unavoidable coupling?
2. **Refactoring cost**: How much effort to extract the shared dependency?
3. **Pattern fit**: Does the relationship suggest an event-driven redesign?
4. **Urgency**: Is this a production bug needing immediate fix, or pre-deployment cleanup?

### Decision Tree
```
CircularDependencyException detected
├── Does the cycle involve two classes that genuinely need bidirectional communication?
│   ├── Yes → Consider event-driven decoupling:
│   │   ├── Class A dispatches event, Class B listens
│   │   └── No direct constructor dependency — cycle broken
│   └── No → Is there a shared concern that can be extracted?
│       ├── Yes → Extract into a third class C that both A and B depend on:
│       │   └── Result: A → C, B → C (no cycle)
│       └── No → Is lazy resolution appropriate?
│           ├── Yes → Use lazy resolution (Closure or proxy) as LAST resort:
│           │   ├── Inject Closure that resolves the dependency on demand
│           │   └── Document why structural refactoring was not possible
│           └── No → (should not happen — lazy resolution is always possible but not always wise)
├── NEVER use these "fixes":
│   ├── ❌ app(Service::class) inside constructor (service locator)
│   ├── ❌ Setter injection to "hide" the cycle
│   └── ❌ Interface abstraction without restructuring
```

### Rationale
Circular dependencies are almost always a design smell. The preferred fix is structural: extract the shared concern into a third class, or use events to decouple. Lazy resolution (injecting a `Closure` that resolves the dependency) should be the last resort — it works technically but hides the underlying design issue. Service locator (`app()` inside constructors) is never the right fix.

### Default
Structural extraction first. Event-driven decoupling second. Lazy resolution last.

### Risks
- Lazy resolution hides the cycle = debugging harder later.
- `app()` inside constructor = untestable, service locator anti-pattern.
- Extracting the wrong class = the cycle may reappear.

### Related Rules/Skills
- Skill: Circular Dependency Resolution

---

## D02: Detection Prevention

### Decision Context
You are designing class dependencies and want to prevent circular dependencies from occurring.

### Criteria
1. **Dependency direction**: Are dependencies flowing in one direction (high-level → low-level)?
2. **Layer boundaries**: Are cross-layer calls following the dependency rule?
3. **Static analysis**: Is a tool like deptrac in use?
4. **Code review**: Are dependency graphs reviewed?

### Decision Tree
```
Designing to prevent circular dependencies
├── Have you established a dependency direction convention?
│   ├── Yes → Verify: high-level policy depends on low-level detail, NOT vice versa
│   │   └── Example: Service → Repository (Service depends on Repository)
│   │   └── Anti-example: Repository → Service (Repository depends on Service — cycle risk)
│   └── No → Establish the convention: dependencies flow inward (Controller → Service → Repository)
├── Do models/services/repositories follow clean layering?
│   ├── Models should NOT depend on services?
│   │   ├── OK: Service → Repository → Model
│   │   └── Cycle risk: Model → Service → Repository → Model
│   └── Are events used for cross-cutting communication?
│       ├── Yes → Events naturally break cycles (A dispatches, B listens, no direct dependency)
│       └── No → Consider events for bidirectional communication needs
├── Are there static analysis checks in CI?
│   ├── Yes → Good — cycles caught pre-deployment
│   └── No → Add deptrac or similar to CI pipeline
```

### Rationale
Circular dependencies are prevented by design, not detected at runtime. The key principles are: (1) dependencies flow inward (Controllers → Services → Repositories), (2) models never depend on services, (3) events for bidirectional communication, and (4) static analysis verification. Adhering to these patterns eliminates the vast majority of circular dependency scenarios.

### Default
Layer-based dependency direction (Controller → Service → Repository). Events for cross-layer communication.

### Risks
- No explicit dependency convention = ad-hoc dependencies, increasing cycle risk.
- Models calling services = the most common cycle pattern in Laravel applications.
- No static analysis = cycles discovered at runtime in production.

### Related Rules/Skills
- Skill: Circular Dependency Resolution

---

## D03: Cycle Diagnosis Strategy

### Decision Context
A `CircularDependencyException` with a long resolution chain has been thrown. How do you trace and identify the exact cycle?

### Criteria
1. **Exception message**: Does the exception include the resolution chain array?
2. **Build stack**: What classes appear in the `$buildStack` at the point of failure?
3. **Constructor inspection**: Which constructor parameters of each class create the circular reference?

### Decision Tree
```
Circular dependency detected at runtime
├── Read the exception message — it contains the full resolution chain:
│   └── Example: Circular dependency detected: A → B → C → A
│   └── The chain shows exactly which classes form the cycle
├── Identify the cycle entry point:
│   ├── The first and last class in the chain are the same (or the cycle repeats)
│   └── Trace: A depends on B, B depends on C, C depends on A
├── For each class in the cycle, inspect the constructor:
│   ├── Which parameter creates the next dependency in the chain?
│   ├── Is that dependency truly needed in the constructor?
│   │   ├── Yes → Class genuinely needs the dependency
│   │   └── No → Remove unnecessary dependency
│   └── Can the dependency be method-injected instead?
│       ├── Yes → Move to method injection (breaks constructor cycle)
│       └── No → Structural fix required (extract shared dependency or use events)
├── Verify the fix: resolve each class independently and confirm no exception
```

### Rationale
The `CircularDependencyException` message includes the full resolution chain. Reading this chain is the fastest way to identify the cycle. The chain shows the order of resolution: the first class triggers resolution of the second, which triggers the third, and so on until a class is encountered twice. Focus on the first and last class in the chain to understand the cycle.

### Default
Read the exception's resolution chain. Trace each constructor parameter. Fix by extracting or decoupling.

### Risks
- Ignoring the exception message = repeating the same debugging steps.
- Fixing the wrong link in the chain = cycle persists.
- Assuming the first reported class is the root cause = may be a downstream symptom.

### Related Rules/Skills
- Skill: Circular Dependency Resolution
