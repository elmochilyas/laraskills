# Custom State Machine — Decomposition

## Prime Directive
Build a custom state machine for Eloquent models that provides clear transition rules, guard enforcement, and persistence integration without external package dependencies.

## 1. Problem Space Decomposition

### 1.1 State Enum Design
- **Concern:** Choosing and structuring the state enumeration.
- **Sub-concerns:**
  1. Backing type (string vs int) and database column type
  2. Enum methods for querying state metadata (label, color, group)
  3. Serialization for API responses and form fields

### 1.2 Transition Map Architecture
- **Concern:** Where and how to define allowed transitions.
- **Sub-concerns:**
  1. Static array definition vs config file vs database-driven
  2. Supporting conditional transitions (allowed only under certain conditions)
  3. Override mechanism for subclasses or tenant-specific workflows

### 1.3 Transition Execution
- **Concern:** The mechanics of moving between states.
- **Sub-concerns:**
  1. Atomicity of state change + side effects
  2. Pre-transition and post-transition hooks
  3. Guard execution order

### 1.4 Model Integration
- **Concern:** How the model exposes state machine functionality.
- **Sub-concerns:**
  1. Trait vs service layer approach
  2. Blocking direct attribute writes (encapsulation)
  3. Lazy-loading related state configuration

## 2. Solution Space Decomposition

### 2.1 State Representation
- **Decision:** Enum shape and metadata.
- **Implementation slices:**
  1. Simple enum with `value` backing string
  2. Enum with methods: `label()`, `allowedTransitions()`, `isActive()`
  3. Enum with `\App\Enum\Concerns\HasTransitions` trait

### 2.2 Transition Map
- **Decision:** Where transition rules are defined.
- **Implementation slices:**
  1. Static method on the enum class
  2. Dedicated config file `config/state-machines/order.php`
  3. StateMachine class with injected map

### 2.3 Guard System
- **Decision:** How guards integrate with transitions.
- **Implementation slices:**
  1. Inline guard checks in the transition method
  2. Guard classes invoked by the state machine
  3. Chain of responsibility for multiple guards

### 2.4 Persistence Safety
- **Decision:** Transaction strategy for transitions.
- **Implementation slices:**
  1. Single `save()` inside transition; no explicit transaction
  2. `DB::transaction()` wrapping transition + event dispatch
  3. Optimistic lock via version column

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Eloquent Model | Holds status enum attribute; calls state machine methods |
| State Machine Class | Encapsulates transition map, guards, execution logic |
| Enum Class | Defines states and their metadata |
| Controller | Calls `OrderStateMachine::transition($order, Status::Shipped)` |
| Policy | Authorizes transitions before execution |
| Event System | Listens for model `updated` event triggered by transition |
| Database | Stores status column; optional state_log table for history |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization