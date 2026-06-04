# Decorator — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Decorator pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Decorator Modifying Wrapped Component's State | Critical |
| 2 | Decorator Ordering Assumptions | High |
| 3 | Throwing Exceptions from Decorator Without Cleanup | High |
| 4 | Decorator Wrapping with Incompatible Lifetime | Medium |
| 5 | Not Delegating to Parent | Critical |

---

## 1. Decorator Modifying Wrapped Component's State

### Category
Reliability

### Description
A decorator modifies the state of the wrapped component (the object it decorates), causing unpredictable behavior when the component is shared or reused.

### Why It Happens
Decorator is treated as a wrapper with permission to modify the wrapped object.

### Warning Signs
- Decorator calling setters on wrapped object
- Wrapped object state changes after decorator call
- Shared wrapped objects behaving differently depending on decorator usage
- Side effects in decorator beyond adding behavior

### Why Harmful
Modifying wrapped component state creates hidden coupling. The same component behaves differently depending on which decorators wrap it.

### Consequences
- Side effects on shared objects
- Unpredictable behavior
- Testing difficulty
- Hidden state changes

### Alternative
Decorators should be stateless with respect to the wrapped object. Add behavior around calls, not by modifying internal state.

### Refactoring Strategy
1. Identify wrapped object modifications
2. Remove state mutations
3. Use composition for added behavior
4. Test decorator independence

### Detection Checklist
- [ ] Check decorator for wrapped object mutations
- [ ] Test shared wrapped component behavior
- [ ] Verify decorator side-effect-free

### Related Rules/Skills/Trees
- Skills: Decorator, Immutability

---

## 2. Decorator Ordering Assumptions

### Category
Architecture

### Description
Decorators that assume a specific ordering (e.g., logging decorator assumes caching decorator is inner, or vice versa), creating hidden coupling.

### Why It Happens
Decorator logic depends on the state or behavior of another decorator in the stack.

### Warning Signs
- Logging before caching assumes cache miss logging occurs
- Caching after logging logs every cache hit
- Decorator behavior changes with different ordering
- Comments specifying required decorator order

### Why Harmful
The decorator pattern's flexibility (composable ordering) is lost. Adding/removing decorators breaks behavior.

### Consequences
- Fixed ordering requirement
- Hidden coupling
- Brittle decorator stack
- Maintenance difficulty

### Alternative
Each decorator should be independent. If ordering matters, document and test the expected order, or combine into a single decorator.

### Refactoring Strategy
1. Identify ordering dependencies
2. Document expected order
3. Add integration tests for order
4. Consider merging dependent decorators
5. Remove assumptions from code

### Detection Checklist
- [ ] Test different decorator orderings
- [ ] Identify ordering-dependent behavior
- [ ] Check for ordering comments

### Related Rules/Skills/Trees
- Skills: Decorator, Composable Design
- Decision Trees: Decorator Stack Design

---

## 3. Throwing Exceptions from Decorator Without Cleanup

### Category
Reliability

### Description
A decorator throws an exception without cleaning up resources it allocated (open files, DB connections, locked resources), causing resource leaks.

### Why It Happens
Decorator acquires resources for its added behavior but doesn't handle cleanup on error.

### Warning Signs
- Decorator acquiring resources in try without finally
- Resource leaks traced to decorator failures
- Decorator with no error handling
- Partially executed decorator stack on exception

### Why Harmful
Resource leaks accumulate, eventually exhausting connections, file handles, or memory.

### Consequences
- Resource leaks
- Connection pool exhaustion
- File handle leaks
- Accumulated state on retries

### Alternative
Use try-finally for resource cleanup. Decorator should clean up in reverse order of acquisition.

### Refactoring Strategy
1. Identify resource acquisition in decorators
2. Add try-finally cleanup
3. Release resources on exception
4. Test decorator failure scenarios

### Detection Checklist
- [ ] Check decorators for resource acquisition
- [ ] Verify cleanup in failure paths
- [ ] Test resource leak scenarios

### Related Rules/Skills/Trees
- Skills: Decorator, Resource Management, Exception Safety

---

## 4. Decorator Wrapping with Incompatible Lifetime

### Category
Reliability

### Description
A long-lived decorator wraps a short-lived component, or vice versa, causing stale references or premature destruction.

### Why It Happens
Lifetime management is not considered when composing decorators. Singleton decorators wrap transient components.

### Warning Signs
- Singleton decorator wrapping transient component
- Stale references after component re-creation
- Memory leaks in long-running processes
- Transient component held by singleton decorator

### Why Harmful
Lifetime mismatch causes either stale data (singleton holds old transient) or memory leaks (singleton prevents transient GC).

### Consequences
- Stale data
- Memory leaks
- GC issues
- Hard-to-diagnose lifetime issues

### Alternative
Match decorator lifetimes to wrapped component lifetimes. Or use factory pattern to create decorator+component together.

### Refactoring Strategy
1. Identify lifetime mismatches
2. Align lifetimes
3. Or use factory for consistent creation
4. Test in long-running scenarios

### Detection Checklist
- [ ] Check decorator and component lifetimes
- [ ] Test with concurrent/long-running processes
- [ ] Verify memory behavior

### Related Rules/Skills/Trees
- Skills: Decorator, Object Lifetime Management
- Decision Trees: Singleton vs Transient

---

## 5. Not Delegating to Parent

### Category
Reliability

### Description
A decorator fails to call the parent/wrapped method in some code path, silently swallowing behavior and breaking the decorator chain.

### Why It Happens
Missing `return parent::method()` or `$this->wrapped->method()` in conditional branches.

### Warning Signs
- Decorator with conditional path that doesn't delegate
- Decorator returns early without calling wrapped
- Behavior missing when decorator is present
- Debugging shows decorator short-circuits chain

### Why Harmful
The decorator is meant to ADD behavior, not replace it. Missing delegation causes unexpected behavior loss.

### Consequences
- Missing functionality
- Silent behavior loss
- Debugging confusion
- Broken decorator chain

### Alternative
Every code path must eventually call the wrapped method (or explicitly decide not to, with documentation).

### Refactoring Strategy
1. Identify missing delegation paths
2. Add delegation to all code paths
3. Document intentional non-delegation
4. Test with and without decorator

### Detection Checklist
- [ ] Review all decorator code paths for delegation
- [ ] Test behavior with/without decorator
- [ ] Verify behavior is added, not replaced

### Related Rules/Skills/Trees
- Skills: Decorator, Delegation Pattern
