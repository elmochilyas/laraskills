# Decision Trees: DTOs and Transformers

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-14-dto-transformer
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | DTO vs Array vs Eloquent Model | Architectural | Design |
| 2 | DTO per Use Case vs Shared DTOs | Design | Design |
| 3 | JsonResource vs Custom Transformer | Design | Implement |
| 4 | Manual DTO vs Spatie Laravel Data | Design | Design |
| 5 | Input DTO vs Form Request | Architectural | Design |
| 6 | DTO vs Value Object | Architectural | Design |

---

## Decision 1: DTO vs Array vs Eloquent Model

### Context
How to pass data between layers.

### Decision Tree
Will this data cross an architectural layer boundary (application → domain, controller → use case)?
- **YES** → Continue
- **NO** → Array or internal object is fine

Does the data need a stable contract with documented fields?
- **YES** → DTO
- **NO** → Continue

Will more than one consumer use this data?
- **YES** → DTO
- **NO** → Continue

Is this a simple key-value pass-through with no transformation?
- **YES** → Array may suffice
- **NO** → DTO

### Recommended Default
DTO at every architectural boundary. Arrays for internal method calls within the same layer.

### Risks
- Arrays: no type safety, no discoverability, fragile
- Eloquent models: lazy loading, ORM coupling, too much data
- DTOs everywhere: more classes, but each is explicit

---

## Decision 2: DTO per Use Case vs Shared DTOs

### Context
Whether to create a dedicated DTO for each use case or share across related operations.

### Decision Tree
Do the use cases return different subsets of the same entity's data?
- **YES** → Continue
- **NO** → DTO per use case

Are the consumers different (API vs admin panel vs export)?
- **YES** → Separate DTOs per consumer
- **NO** → Continue

Will the DTO likely change for one use case but not others?
- **YES** → DTO per use case (independent evolution)
- **NO** → Shared DTO possible

### Recommended Default
DTO per use case. Extract shared properties to a common parent DTO if needed.

### Risks
- Shared DTO: changes for one use case affect all consumers
- DTO per use case: more classes, but zero coupling

---

## Decision 3: JsonResource vs Custom Transformer

### Context
Which transformer pattern to use for API responses.

### Decision Tree
Is the transformer for a Laravel API response (framework-integrated)?
- **YES** → Continue
- **NO** → Custom Transformer

Do you need automatic relationship inclusion (`with`, `include`)?
- **YES** → JsonResource
- **NO** → Continue

Is the transformer used outside HTTP context (CLI, email, export)?
- **YES** → Custom Transformer (no framework dependency)
- **NO** → JsonResource

Do you control the response envelope format?
- **YES** → JsonResource (flexible enough)
- **NO** → Continue

Does the project need framework-independent transformation?
- **YES** → Custom Transformer
- **NO** → JsonResource

### Recommended Default
JsonResource for standard API endpoints. Custom Transformer for non-HTTP contexts or framework-independent code.

### Risks
- JsonResource outside HTTP: cannot use without Laravel
- Custom Transformer for API: more manual work for pagination, includes, conditional attributes

---

## Decision 4: Manual DTO vs Spatie Laravel Data

### Context
Whether to write DTOs by hand or use the spatie/laravel-data package.

### Decision Tree
Does the project have 20+ DTOs?
- **YES** → Consider Spatie (reduces boilerplate)
- **NO** → Continue

Do DTOs need validation, transformation, or nesting support?
- **YES** → Consider Spatie
- **NO** → Continue

Is the team comfortable with a third-party dependency for DTOs?
- **YES** → Spatie may be suitable
- **NO** → Manual DTOs

Does the project need strict immutability enforcement?
- **YES** → Manual DTOs with readonly classes
- **NO** → Either works

### Recommended Default
Manual DTOs with `readonly` classes for most projects. Spatie for DTO-heavy projects (20+ types).

### Risks
- Spatie: dependency risk, learning curve, magic methods
- Manual DTOs: boilerplate for many DTOs, no built-in validation

---

## Decision 5: Input DTO vs Form Request

### Context
Whether to use an input DTO or Form Request for HTTP input.

### Decision Tree
Will the same input be accepted from non-HTTP sources (CLI, queue)?
- **YES** → Input DTO (interface-agnostic)
- **NO** → Continue

Does the input need HTTP-specific authorization or validation?
- **YES** → Form Request (has authorize(), Laravel validation integration)
- **NO** → Input DTO

Is the endpoint purely HTTP and likely to remain so?
- **YES** → Form Request is sufficient
- **NO** → Input DTO

### Recommended Default
Form Request for HTTP-only validation. Input DTO when the same data comes from multiple sources.

### Risks
- Form Request for multi-source input: cannot be reused, must duplicate extraction
- DTO without Form Request: lose authorize() and built-in validation integration

---

## Decision 6: DTO vs Value Object

### Context
Whether to model data as a DTO or Value Object.

### Decision Tree
Does the concept have behavior (calculations, invariants, validation)?
- **YES** → Value Object
- **NO** → Continue

Does the concept need identity or equality semantics?
- **YES** → Value Object (has equals(), self-validates)
- **NO** → Continue

Is this data purely for transfer between layers with no behavior?
- **YES** → DTO
- **NO** → Value Object

### Recommended Default
DTO for layer-boundary data transfer. Value Object for domain concepts with behavior.

### Risks
- DTO for domain concepts: anemic domain model, business logic lives in services
- Value Object for transfer data: behavior where none is needed, unnecessary complexity
