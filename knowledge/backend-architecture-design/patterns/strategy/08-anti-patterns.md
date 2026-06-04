# Strategy — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Strategy pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Strategy Interface Too Specific | High |
| 2 | Strategy Methods with Side Effects | High |
| 3 | Strategy Selection Logic Spread Across Codebase | Medium |
| 4 | Strategies Duplicating Common Logic | Medium |
| 5 | Not Testing Strategies in Combination with Context | High |

---

## 1. Strategy Interface Too Specific

### Category
Architecture

### Description
The strategy interface is tightly coupled to a specific implementation's requirements, making it impossible for new algorithms to conform.

### Why It Happens
The interface is designed around the first strategy's needs, not abstracted to the general algorithm concept.

### Warning Signs
- Adding a new strategy requires interface changes
- Strategy methods with parameter names matching one implementation
- Interface doesn't generalize across variants
- New strategies leave parameters unused

### Why Harmful
The pattern's purpose (interchangeable algorithms) is defeated when the interface must change for each new strategy.

### Consequences
- Interface instability
- Strategy cannot be added without modifying interface
- Actually breaks OCP
- New strategies forced into wrong contract

### Alternative
Design the interface around the common algorithm concept, not the first implementation. Use DTOs or parameter objects for flexible input.

### Refactoring Strategy
1. Review interface for implementation-specific details
2. Abstract to general algorithm concept
3. Use parameter objects for varying input
4. Add new strategies without interface changes

### Detection Checklist
- [ ] Evaluate interface generality
- [ ] Check if new strategies need interface changes
- [ ] Review parameter naming and structure

### Related Rules/Skills/Trees
- Skills: Strategy, Interface Design
- Decision Trees: Strategy Interface Design

---

## 2. Strategy Methods with Side Effects

### Category
Reliability

### Description
Strategy methods produce side effects (class-level state changes, global state modifications) that make the same algorithm produce different results depending on call order or context.

### Why It Happens
Strategy objects are reused. State accumulates across calls.

### Warning Signs
- Strategy methods modifying object properties
- Calling same strategy twice produces different results
- Strategy order affects outcome
- Side effects in strategy implementation

### Why Harmful
Strategy intent is algorithm interchangeability. Side effects make strategies non-deterministic and prevent safe reuse.

### Consequences
- Non-deterministic results
- Order-dependent behavior
- Testing difficulty
- Shared state contamination

### Alternative
Strategies should be stateless functions. Produce a result from input. No side effects. Use new instances per operation if state is needed.

### Refactoring Strategy
1. Identify side effects in strategies
2. Remove or externalize
3. Make methods pure functions
4. Test idempotency

### Detection Checklist
- [ ] Check strategies for side effects
- [ ] Test repeated execution consistency
- [ ] Verify statelessness

### Related Rules/Skills/Trees
- Skills: Strategy, Functional Design, Immutability

---

## 3. Strategy Selection Logic Spread Across Codebase

### Category
Architecture

### Description
The logic for selecting which strategy to use (based on context, type, or configuration) is duplicated and scattered across controllers, services, and views.

### Why It Happens
Each caller knows how to select the right strategy. As callers multiply, selection logic duplicates.

### Warning Signs
- Same if/else or switch for strategy selection in multiple places
- Selecting strategy in controllers, services, and views
- Adding new strategy requires modifying N call sites
- Strategy resolution logic not centralized

### Why Harmful
Adding a new strategy requires finding and updating all selection points. Selection logic drifts across copies.

### Consequences
- DRY violation
- Inconsistent selection
- High change cost
- Bug-prone duplication

### Alternative
Use a strategy factory or registry that encapsulates selection logic. Callers request strategy by simple identifier.

### Refactoring Strategy
1. Identify strategy selection duplication
2. Create factory method
3. Centralize selection logic
4. Callers use factory only
5. Test factory behavior

### Detection Checklist
- [ ] Scan for strategy selection duplication
- [ ] Count selection points
- [ ] Assess change impact

### Related Rules/Skills/Trees
- Skills: Strategy, Factory Pattern
- Decision Trees: Strategy Selection Design

---

## 4. Strategies Duplicating Common Logic

### Category
Architecture

### Description
Multiple strategies share the same boilerplate or helper code that is duplicated across implementations instead of shared.

### Why It Happens
Each strategy is independently implemented. Common logic is copied.

### Warning Signs
- Same validation or transformation code in multiple strategies
- Helper functions duplicated across strategy files
- Adding new strategy requires recoding common steps
- Template pattern better suited

### Why Harmful
Duplicated code violates DRY. Changes to shared logic must be applied to all strategies.

### Consequences
- DRY violation
- Maintenance burden
- Inconsistent fixes
- Higher bug rate

### Alternative
Extract common logic to a base class, trait, or helper service. Use Template Method if the algorithm skeleton is shared with variant steps.

### Refactoring Strategy
1. Identify duplicated logic
2. Extract to trait, base class, or service
3. Share across strategies
4. Test shared logic once
5. Consider Template Method pattern

### Detection Checklist
- [ ] Compare strategies for duplicated code
- [ ] Evaluate extraction opportunities
- [ ] Consider Template Method alternative

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Strategy, Template Method, DRY

---

## 5. Not Testing Strategies in Combination with Context

### Category
Reliability

### Description
Strategies are tested in isolation but not in combination with the context class that selects and calls them, causing integration failures.

### Why It Happens
Unit tests focus on individual strategies. The interaction between context and strategy is not tested.

### Warning Signs
- Strategy tests passing, integration tests failing
- Context passing wrong data to strategy
- Strategy expectations mismatched with context inputs
- Integration bugs not caught by unit tests

### Why Harmful
The strategy pattern's value depends on correct context-strategy interaction. Untested integration hides bugs in data flow.

### Consequences
- Integration bugs
- Context-strategy mismatch
- False confidence from unit tests
- Production failures

### Alternative
Test each strategy with the actual context inputs. Write integration tests that verify correct strategy selection and execution.

### Refactoring Strategy
1. Create integration tests for context-strategy combinations
2. Test with various inputs
3. Verify correct strategy selection
4. Verify strategy output handling
5. Add edge case tests

### Detection Checklist
- [ ] Check for context-strategy integration tests
- [ ] Verify strategy selection in tests
- [ ] Test with real context inputs

### Related Rules/Skills/Trees
- Skills: Strategy, Integration Testing
