# Domain Methods on Models — Decomposition

## Prime Directive
Design a system of behavior methods on Eloquent models that captures the domain's ubiquitous language, enforces invariants, and remains testable and maintainable as the model grows.

## 1. Problem Space Decomposition

### 1.1 Method Identity & Naming
- **Concern:** Each domain operation must have a clear, consistent name from the ubiquitous language.
- **Sub-concerns:**
  1. Verb selection (`publish` vs `makePublished` vs `setPublishedStatus`)
  2. Consistency across models (all "activation" methods follow same pattern)
  3. Distinguishing commands vs queries in naming

### 1.2 Invariant Enforcement
- **Concern:** Domain methods must guarantee the model is in a valid state before and after execution.
- **Sub-concerns:**
  1. Precondition checks (is the model in an allowed state?)
  2. Authorization checks (can the current actor perform this operation?)
  3. Postcondition validation (did the method achieve the intended effect?)

### 1.3 Side-Effect Management
- **Concern:** Domain methods often need to trigger external effects (notifications, logging, integration events).
- **Sub-concerns:**
  1. Synchronous vs deferred side effects
  2. Failure atomicity: if side effects fail, does the mutation roll back?
  3. Observability and audit logging

### 1.4 Testability
- **Concern:** Domain methods must be testable without excessive setup or slow database operations.
- **Sub-concerns:**
  1. Isolating the method from its side effects for unit tests
  2. Testing invariant violations (expected exceptions)
  3. Testing cascading state changes on related models

## 2. Solution Space Decomposition

### 2.1 Method Signature Convention
- **Decision:** Return type and naming convention.
- **Implementation slices:**
  1. `public function markAsPaid(): self` (fluent)
  2. `public function markAsPaid(): void` (void)
  3. `public function markAsPaid(): PaymentResult` (result object)

### 2.2 Guard Implementation
- **Decision:** How to check preconditions.
- **Implementation slices:**
  1. `throw_unless($this->isPending(), new OrderNotPendingException)`
  2. `$this->authorize('update')` for actor permissions
  3. Multi-condition validation before mutation

### 2.3 Persistence Strategy
- **Decision:** Whether domain methods call `save()` or rely on external persistence.
- **Implementation slices:**
  1. Internal `save()` at method end (most common)
  2. Return mutated model without saving (caller persists)
  3. Deferred via unit-of-work tracked changes

### 2.4 Side-Effect Wiring
- **Decision:** How external effects connect to domain methods.
- **Implementation slices:**
  1. Direct dispatch inside method (tight coupling)
  2. Domain event dispatch at method end (decoupled)
  3. Queue job submission from event listener (async)

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Controller | Parses input, calls one or more domain methods, responds |
| Form Request | Validates HTTP-level input before calling domain methods |
| Policy | Called within domain method guards for authorization |
| Event System | Domain methods dispatch events for side-effect handling |
| Notification System | Wired via event listeners to trigger on domain operations |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization