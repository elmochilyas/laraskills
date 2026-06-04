# Spatie Model States — Decomposition

## Prime Directive
Implement a state machine using `spatie/laravel-model-states` that cleanly maps domain states to classes, enforces valid transitions, and supports transition side effects without coupling the state machine to infrastructure concerns.

## 1. Problem Space Decomposition

### 1.1 State Identification & Class Design
- **Concern:** Mapping domain states to State classes.
- **Sub-concerns:**
  1. Base class selection (`State` vs `BaseState` vs custom)
  2. State class namespace and organization
  3. Shared behavior across related states (via traits or abstract classes)

### 1.2 Transition Configuration
- **Concern:** Defining which transitions are allowed.
- **Sub-concerns:**
  1. Declaring transitions in each state class
  2. Handling symmetrical vs asymmetrical transitions
  3. Dynamic transitions depending on runtime conditions

### 1.3 Transition Side Effects
- **Concern:** Executing logic when transitions occur.
- **Sub-concerns:**
  1. Simple transitions (no extra logic) vs complex transitions
  2. Extracting side effects to Transition classes vs event listeners
  3. Transactional safety of transition + side effects

### 1.4 State Querying & Scopes
- **Concern:** Filtering and querying models by state.
- **Sub-concerns:**
  1. Global query scopes for state-filtered queries
  2. Eager-loading state for display lists
  3. State counts and analytics

## 2. Solution Space Decomposition

### 2.1 State Class Structure
- **Decision:** Organization of state classes.
- **Implementation slices:**
  1. `app/Models/States/Order/Pending.php` — one directory per model
  2. Abstract base state for shared transition methods
  3. Trait for state-related scopes and helpers on the model

### 2.2 Transition Declaration
- **Decision:** Where allowed transitions are defined.
- **Implementation slices:**
  1. `transitionableStates()` on each state class (distributed)
  2. Static `config()` method returning the full graph (centralized)
  3. Database-driven transitions for admin-configurable workflows

### 2.3 Transition Class Strategy
- **Decision:** When to use Transition classes.
- **Implementation slices:**
  1. No transition class: `$model->state->transitionTo(Shipped::class)`
  2. Transition class for side effects: `PendingToApproved` that dispatches events
  3. Transition class with DI for complex workflows

### 2.4 History & Audit
- **Decision:** How to log transition history.
- **Implementation slices:**
  1. Model event listener logs to `state_transitions` table
  2. Transition classes record history as part of the operation
  3. Dedicated observer observing the state field changes

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Eloquent Model | Has the `HasStates` trait and state cast field |
| State Classes | Extend `State`, define allowed transitions |
| Transition Classes | Optional, registered via state class configuration |
| Database | Stores state as string column; optional history table |
| Controller | Calls `$model->state->transitionTo()` after authorization |
| Event Listener | Observes `updated` to log transitions or trigger side effects |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization