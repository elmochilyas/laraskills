# Active Record Domain Layer — Decomposition

## Prime Directive
Determine when the Active Record pattern serves as an effective domain layer and when auxiliary patterns (services, repositories, value objects) become necessary to maintain coherence.

## 1. Problem Space Decomposition

### 1.1 Data Access vs Domain Behavior Cohesion
- **Concern:** Active Record conflates persistence and domain logic; the question is whether this conflation clarifies or obscures the domain.
- **Sub-concerns:**
  1. How to expose querying without leaking SQL-like concerns into domain consumers
  2. How to enforce that mutation goes through named domain methods (not `update()` or direct attribute assignment)
  3. How to handle cross-entity logic that doesn't naturally live on a single model

### 1.2 Encapsulation Boundaries
- **Concern:** Preventing external code from bypassing domain invariants.
- **Sub-concerns:**
  1. Mass-assignment protection as an encapsulation mechanism
  2. Keeping relationships (collections) behind behavior methods
  3. Preventing direct `save()` calls from outside the model's domain methods

### 1.3 Testing Fidelity
- **Concern:** Domain logic coupled to the database makes unit tests slow and brittle.
- **Sub-concerns:**
  1. Using SQLite in-memory for fast model tests
  2. Isolating persistence from pure domain logic via extracted value objects
  3. Deciding which tests truly require a database

## 2. Solution Space Decomposition

### 2.1 Model Constitution
- **Decision:** Which Eloquent conventions to adopt, which to override.
- **Implementation slices:**
  1. `$guarded` / `$fillable` configuration
  2. Casts and accessors/mutators for value object mapping
  3. Disabling mass-assignment for sensitive attributes

### 2.2 Behavior Method Design
- **Decision:** Signature conventions for domain methods on models.
- **Implementation slices:**
  1. Return type conventions (self, void, Result objects)
  2. Exception vs boolean return for failure cases
  3. Precondition checks (guards) at method entry

### 2.3 Relationship Encapsulation
- **Decision:** How much of the related-object API to expose.
- **Implementation slices:**
  1. Custom collection classes with domain-named methods
  2. Hiding raw relationship properties behind getters
  3. Caching computed aggregates on the parent model

### 2.4 Service Extraction Threshold
- **Decision:** When to move logic out of the model.
- **Implementation slices:**
  1. Single-model logic stays on the model
  2. Two-model coordination may stay or move
  3. Three-plus model or external-side-effect logic moves to a service

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Controllers | Call model behavior methods after parsing input; respond with results |
| Form Requests | Validate input shape before reaching model methods |
| Domain Services | Receive model instances as arguments when logic crosses multiple models |
| Repositories | Optional wrapper that delegates to Eloquent queries and returns hydrated domain models |
| Event System | Dispatch domain events at the end of behavior methods for side-effect decoupling |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization