# Facade — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Facade pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Confusing Laravel Facades with GoF Facade | Medium |
| 2 | Facade Exposing All Subsystem Methods | High |
| 3 | Multiple Facades for Same Subsystem | Medium |
| 4 | Facade with Mutable State | High |
| 5 | Over-Facading: Facade for Every Class | Medium |

---

## 1. Confusing Laravel Facades with GoF Facade

### Category
Architecture

### Description
Developers confuse Laravel's Facade system (static proxy to container service) with the GoF Facade pattern (simplified subsystem interface), using Laravel Facades where a real GoF Facade is needed.

### Why It Happens
Naming collision between Laravel "Facade" and GoF "Facade". Developers use Laravel Facades for simplification without understanding the architectural difference.

### Warning Signs
- Laravel Facades used for subsystem simplification
- `use Illuminate\Support\Facades\*` as "architectural facades"
- No real GoF Facade class created
- Confusion about which pattern to apply

### Why Harmful
Laravel Facades provide static access to services, not simplified subsystem interfaces. The wrong pattern is applied for the wrong purpose.

### Consequences
- Pattern misuse
- Hidden dependencies (Laravel Facades)
- No real subsystem encapsulation
- Testing difficulties

### Alternative
Use GoF Facade (a real class) for subsystem simplification. Use Laravel Facades for convenient access to container services.

### Refactoring Strategy
1. Identify Laravel Facade misuse as architectural facade
2. Create GoF Facade class
3. Inject GoF Facade via constructor
4. Remove exotic Laravel Facade imports

### Detection Checklist
- [ ] Check for Laravel Facade vs GoF Facade confusion
- [ ] Verify facade pattern selection
- [ ] Review facade location in architecture

### Related Rules/Skills/Trees
- Skills: Facade, Laravel Facades
- Decision Trees: GoF Facade vs Laravel Facade

---

## 2. Facade Exposing All Subsystem Methods

### Category
Architecture

### Description
The facade exposes every method of the underlying subsystem, providing no simplification — just delegation.

### Why It Happens
Facade is created as a mechanical pass-through. No thought is given to which methods simplify the client's job.

### Warning Signs
- Facade has same number of methods as subsystem
- Facade methods are one-to-one with subsystem
- No new simplified methods
- Facade provides no abstraction value

### Why Harmful
The facade adds indirection without simplification. Clients still need to understand the full subsystem API.

### Consequences
- No simplification
- Unnecessary indirection
- Double maintenance
- No abstraction value

### Alternative
Design the facade with fewer, higher-level methods that encapsulate common subsystem usage patterns.

### Refactoring Strategy
1. Identify common subsystem usage patterns
2. Create high-level facade methods
3. Remove one-to-one pass-through methods
4. Add documentation for facade API

### Detection Checklist
- [ ] Compare facade and subsystem method counts
- [ ] Evaluate facade simplification value
- [ ] Check for high-level methods

### Related Rules/Skills/Trees
- Skills: Facade, API Design
- Decision Trees: Facade vs Adapter

---

## 3. Multiple Facades for Same Subsystem

### Category
Architecture

### Description
Multiple facade classes provide different access points to the same subsystem, creating inconsistent APIs and confusion about which to use.

### Why It Happens
Different teams create different facades for the same subsystem. No coordination.

### Warning Signs
- 2+ facade classes for the same subsystem
- Facades providing overlapping functionality
- Inconsistent method naming across facades
- Confusion about which facade to use

### Why Harmful
Multiple facades defeat the purpose of a unified, simplified interface. Clients use different facades, creating inconsistent access patterns.

### Consequences
- Inconsistent access patterns
- Confusion
- Duplicated facade logic
- Higher maintenance

### Alternative
One facade per subsystem. If different access patterns are needed, use parameterized methods or separate the subsystem.

### Refactoring Strategy
1. Identify overlapping facade functionality
2. Consolidate into single facade
3. Remove duplicate facades
4. Update all callers

### Detection Checklist
- [ ] Count facades per subsystem
- [ ] Identify overlapping functionality
- [ ] Plan consolidation

### Related Rules/Skills/Trees
- Skills: Facade, Cohesion
- Decision Trees: Facade vs Adapter

---

## 4. Facade with Mutable State

### Category
Reliability

### Description
A facade holds mutable state (configuration, cached data, counters) that changes behavior between calls, making the facade unpredictable.

### Why It Happens
Facade is treated as a convenient place for shared state.

### Warning Signs
- Facade with mutable properties
- Repeated calls with same input give different results
- State-dependent behavior in facade
- Facade used as cache or state holder

### Why Harmful
Mutable state makes facade behavior non-deterministic. Clients get different results from the same call sequence.

### Consequences
- Non-deterministic behavior
- Testing difficulty
- Shared state issues
- Unpredictable results

### Alternative
Facades should be stateless. Pass state-dependent data as method parameters. Use separate services for caching.

### Refactoring Strategy
1. Remove mutable state from facade
2. Move state to parameters or separate services
3. Make methods stateless
4. Test call determinism

### Detection Checklist
- [ ] Check facade for mutable state
- [ ] Test call determinism
- [ ] Verify statelessness

### Related Rules/Skills/Trees
- Skills: Facade, Immutability

---

## 5. Over-Facading: Facade for Every Class

### Category
Architecture

### Description
Creating a facade for every class in the system, adding unnecessary indirection without simplification.

### Why It Happens
Teams over-apply the pattern "for consistency" or "for future flexibility."

### Warning Signs
- Facade count approaches class count
- Most facades add no simplification
- Facades are simple pass-throughs
- Developers complain about facade overhead

### Why Harmful
Each facade adds a file and indirection without value. The codebase becomes harder to navigate.

### Consequences
- Code bloat
- Unnecessary indirection
- Navigation difficulty
- YAGNI violation

### Alternative
Only create facades for complex subsystems that benefit from simplification. Use direct access for simple classes.

### Refactoring Strategy
1. Identify unnecessary facades
2. Remove or inline
3. Direct access for simple classes
4. Document facade creation criteria

### Detection Checklist
- [ ] Evaluate each facade's necessity
- [ ] Measure simplification value
- [ ] Assess codebase bloat

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Facade, YAGNI
