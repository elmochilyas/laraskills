# State — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | State pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | State Object Holding Context Reference | High |
| 2 | Transitions Spread Across State Objects | High |
| 3 | Forgetting to Handle Invalid Transitions | Critical |
| 4 | State Pattern Used for Simple Boolean Switches | Medium |
| 5 | State Objects with Mutable State | High |

---

## 1. State Object Holding Context Reference

### Category
Architecture

### Description
State objects hold a reference to the context object (the object whose state they represent), creating tight coupling and memory/garbage collection issues.

### Why It Happens
State objects need access to context data to make decisions. Passing the context reference is convenient.

### Warning Signs
- State methods receiving or storing context reference
- Circular references between state and context
- Memory leaks in long-running processes
- State objects accessing context properties directly

### Why Harmful
Circular references prevent garbage collection. State logic depends on context internals. Testing requires full context setup.

### Consequences
- Memory leaks (circular references)
- Tight coupling
- Testing complexity
- GC issues in long-running processes

### Alternative
Pass only needed data to state methods as parameters, not the entire context object. State objects should be stateless functions of inputs.

### Refactoring Strategy
1. Remove context reference from state objects
2. Pass required data as method parameters
3. Make state objects stateless
4. Use immutable data transfer

### Detection Checklist
- [ ] Check state objects for context references
- [ ] Test memory behavior in long-running processes
- [ ] Verify state isolation

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: State Pattern, Immutability

---

## 2. Transitions Spread Across State Objects

### Category
Architecture

### Description
Transition logic (which states can transition to which) is spread across multiple state objects instead of being centrally defined, making the state machine hard to understand.

### Why It Happens
Each state object defines its own valid transitions. No centralized transition map.

### Warning Signs
- Transition rules duplicated across states
- Hard to see all possible transitions at a glance
- Adding a new state requires modifying multiple existing states
- Transition validation logic scattered

### Why Harmful
The state machine's behavior is not documented in one place. Changing the graph requires finding and modifying transition rules in multiple state objects.

### Consequences
- Hard to understand state machine
- Transition bugs
- Difficult to add new states
- Inconsistent transition definitions

### Alternative
Use a centralized transition map or configuration that defines all valid transitions and guards.

### Refactoring Strategy
1. Create a transition configuration
2. Define valid transitions centrally
3. State objects check against config
4. Remove inline transition logic from states
5. Document state machine visually

### Detection Checklist
- [ ] Review transition logic distribution
- [ ] Map all possible transitions
- [ ] Check for scattered transition definitions

### Related Rules/Skills/Trees
- Skills: State Pattern, State Machine Design
- Decision Trees: State Machine Architecture

---

## 3. Forgetting to Handle Invalid Transitions

### Category
Reliability

### Description
State objects silently ignore or no-op on invalid transition attempts, allowing the system to remain in an unchanged (but potentially incorrect) state.

### Why It Happens
Developers don't implement transition guard logic. Missing transitions simply do nothing.

### Warning Signs
- Invalid transitions silently ignored
- State doesn't change but no error raised
- Application proceeds with wrong assumptions
- Hard-to-diagnose state issues

### Why Harmful
Silent failures on invalid transitions hide bugs. Business rules are not enforced. The system silently diverges from expected behavior.

### Consequences
- Business rule violations
- Silent state errors
- Hard-to-debug issues
- Data corruption potential

### Alternative
Throw an exception or return a result indicating invalid transition. Always validate transitions explicitly.

### Refactoring Strategy
1. Identify invalid transition cases
2. Add guard conditions
3. Throw domain-specific exception
4. Add tests for invalid transitions
5. Handle at caller level

### Detection Checklist
- [ ] Test invalid transition behavior
- [ ] Check for guard conditions
- [ ] Verify error/exception on invalid transition

### Related Rules/Skills/Trees
- Skills: State Pattern, Guard Conditions
- Decision Trees: State Machine Architecture

---

## 4. State Pattern Used for Simple Boolean Switches

### Category
Architecture

### Description
Implementing State pattern for behavior that has only two boolean states (on/off, active/inactive), overengineering what a simple `if/else` would handle.

### Why It Happens
Developers apply State pattern proactively "for future states" that never materialize.

### Warning Signs
- Only 2 states in the state machine
- Each state implements 1-2 simple methods
- State classes are 5-10 lines each
- No additional states added over time

### Why Harmful
The overhead of state classes, interfaces, and transitions is not justified by the simplicity of the behavior.

### Consequences
- Unnecessary complexity
- More files to maintain
- Developer questioning value
- YAGNI violation

### Alternative
Use a simple boolean flag or ternary expression. Extract to State pattern only when a third state or distinct behavior emerges.

### Refactoring Strategy
1. Replace state classes with boolean check
2. Inline state-specific logic
3. Remove state interface and classes
4. Add comment for future extraction if needed

### Detection Checklist
- [ ] Count states in state machine
- [ ] Evaluate complexity per state
- [ ] Assess YAGNI applicability

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: State Pattern, YAGNI
- Decision Trees: State Pattern When to Apply

---

## 5. State Objects with Mutable State

### Category
Reliability

### Description
State objects contain mutable properties (counters, timestamps, cached results) that cause contamination when state objects are reused across contexts (singleton pattern).

### Why It Happens
State objects created as singletons for performance, but they hold per-operation mutable data.

### Warning Signs
- State objects with setter methods or mutable properties
- Singleton state objects
- State behavior varying between calls with same input
- Data from one context appearing in another

### Why Harmful
Mutable state objects shared across contexts produce incorrect results. State from one operation contaminates the next.

### Consequences
- Shared state contamination
- Unpredictable behavior
- Data leaks across contexts
- Hard-to-reproduce bugs

### Alternative
State objects should be stateless. If state data is needed, pass it as method parameters. Use immutable state objects.

### Refactoring Strategy
1. Remove mutable properties from state objects
2. Move state data to method parameters
3. Make state objects immutable or instantiate per context
4. Test with concurrent usage

### Detection Checklist
- [ ] Check state objects for mutable properties
- [ ] Verify statelessness
- [ ] Test concurrent state usage

### Related Rules/Skills/Trees
- Skills: State Pattern, Immutability, Singleton vs Transient
