# State Pattern Fundamentals — Decomposition

## Prime Directive
Design a state machine for Eloquent models that isolates state-specific behavior, enforces valid transitions, and remains maintainable as the number of states grows.

## 1. Problem Space Decomposition

### 1.1 State Identification
- **Concern:** What distinct states exist in the domain lifecycle?
- **Sub-concerns:**
  1. Distinguishing states from statuses (behavior-changing vs informational)
  2. Identifying implicit vs explicit states (is "archived" really a state or a flag?)
  3. Determining the correct granularity — merging or splitting fine-grained states

### 1.2 Transition Topology
- **Concern:** Which transitions are valid between states.
- **Sub-concerns:**
  1. Complete directed graph of allowed transitions
  2. Transitions that require additional data or authorization
  3. Conditional transitions (allowed only under certain business rules)
  4. Skipping intermediate states (allowed?) or linear progression required

### 1.3 State-Specific Behavior
- **Concern:** What behavior changes depending on the current state.
- **Sub-concerns:**
  1. Operations that are only valid in certain states
  2. Operations that produce different results in different states
  3. Display/formatting differences driven by state

### 1.4 Persistence Mapping
- **Concern:** How states map to database storage.
- **Sub-concerns:**
  1. Single column storage strategy
  2. State history/audit log requirements
  3. Migration strategy for existing status columns

## 2. Solution Space Decomposition

### 2.1 State Representation
- **Decision:** Class-based states vs enum-based states.
- **Implementation slices:**
  1. PHP enums for simple state tracking without behavior
  2. Full State pattern classes when state-specific behavior exists
  3. Hybrid: enums for storage, mapped to state classes in memory

### 2.2 Transition Map
- **Decision:** How to define and enforce allowed transitions.
- **Implementation slices:**
  1. Transitions defined in each state class (distributed)
  2. Centralized transition configuration array/map
  3. Database-stored transition definitions for dynamic workflows

### 2.3 Delegation Mechanism
- **Decision:** How the context delegates to the current state.
- **Implementation slices:**
  1. Direct method delegation (`$this->state->methodName()`)
  2. `__call` magic method forwarding
  3. State method injection via container

### 2.4 Persistence Strategy
- **Decision:** How state is saved and reconstructed.
- **Implementation slices:**
  1. String column with accessor/mutator for state objects
  2. JSON cast for state + metadata
  3. Separate state_log table for full audit trail

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Eloquent Model (Context) | Holds current state reference, delegates behavior |
| State Classes | Implement state-specific behavior and transitions |
| Transition Guard | Validates preconditions before transitions |
| Database | Persists state identifier; optional history table |
| Domain Events | Dispatched on transition for side-effects |
| Controller | Triggers transitions through model domain methods |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization