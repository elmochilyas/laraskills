# Transition Guards — Decomposition

## Prime Directive
Implement a guard system for state transitions that enforces business rules, authorization, and data integrity with clear failure messages and testable individual guard components.

## 1. Problem Space Decomposition

### 1.1 Guard Types
- **Concern:** Identifying different categories of preconditions.
- **Sub-concerns:**
  1. Authorization guards (actor permission)
  2. Business rule guards (domain invariants)
  3. Data completeness guards (required data present)
  4. Temporal guards (time-based conditions)
  5. Relationship guards (related entities in required states)

### 1.2 Guard Composition
- **Concern:** How multiple guards work together.
- **Sub-concerns:**
  1. Evaluation order (does it matter?)
  2. Short-circuit on first failure vs collect all failures
  3. Guard dependencies (a guard that requires another guard's context)
  4. Shared guard context (passing data between guards)

### 1.3 Guard Failure Handling
- **Concern:** What happens when a guard fails.
- **Sub-concerns:**
  1. Exception classes and error messages
  2. Return type for UI hinting
  3. Logging and monitoring of failures
  4. User-facing vs system-facing error messages

### 1.4 Guard Reusability
- **Concern:** Sharing guard logic across transitions and models.
- **Sub-concerns:**
  1. Abstract guard classes or traits
  2. Parameterized guards (configurable per transition)
  3. Guard registration and discovery

## 2. Solution Space Decomposition

### 2.1 Guard Implementation
- **Decision:** Guard as closure, method, or dedicated class.
- **Implementation slices:**
  1. Inline condition in transition method (simple cases)
  2. Guard method on the model (`$order->canBeShipped()`)
  3. Dedicated guard class injected into state machine

### 2.2 Guard Collection
- **Decision:** How guards are grouped for a transition.
- **Implementation slices:**
  1. Array of callables evaluated in order
  2. `GuardCollection` object with `all()` or `first()` failure strategies
  3. Pipeline pattern with passable context

### 2.3 Failure Response
- **Decision:** What the guard returns or throws.
- **Implementation slices:**
  1. `void` — throws `TransitionGuardException` on failure
  2. `bool` — returns `false` on failure
  3. `GuardResult` value object with `allowed`, `reason`, `code`

### 2.4 Actor Access
- **Decision:** How guards access the current user.
- **Implementation slices:**
  1. `Auth::user()` inside guard (convenient but coupled)
  2. Actor passed as argument to guard
  3. Actor resolved via container injection in guard class

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| State Machine | Calls guards before executing transitions |
| Guard Classes | Implement `Guard` interface with `check($model, $actor)` |
| Policy | Laravel Gate checks used within authorization guards |
| Model | Provides state and relationship data for guard checks |
| Controller | Calls `$stateMachine->canTransition()` for UI; `transition()` for execution |
| Logger | Records guard failures for operational monitoring |
| API Resource | Includes `allowed_transitions` with reasons for UI rendering |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization