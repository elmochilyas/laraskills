# Skill: Detect and Break Circular Dependencies

## Purpose
Identify, diagnose, and resolve circular dependencies in the service container's dependency graph — using structural refactoring (extract shared dependency), event-driven decoupling, or lazy injection — while avoiding band-aid patterns like service locators or setter injection.

## When To Use
- Diagnosing and fixing a `CircularDependencyException`
- Designing class dependencies to avoid cycles from the start
- Using lazy resolution patterns (Closure injection) when structural refactoring is impossible
- Evaluating whether a cycle indicates a deeper architectural problem

## When NOT To Use
- Do not use lazy resolution as a band-aid for clearly cyclic architecture
- Do not attempt to override the container's cycle detection — the exception exists for a reason
- Do not use `app()->make()` inside a constructor or method to "break" a cycle
- Do not use setter injection to defer a cycle — the cycle still exists at runtime

## Prerequisites
- Understanding of `Container::$buildStack` — the array tracking the current resolution chain
- Knowledge of circular detection: `in_array($concrete, $this->buildStack, true)` before pushing
- Familiarity with the exception message: the full resolution chain is included

## Inputs
- `CircularDependencyException` message with resolution chain
- Class dependency graph (manually traced or via static analysis tools)
- Affected class constructors showing mutual dependencies

## Workflow
1. Read the full `CircularDependencyException` message — it contains the resolution chain that identifies the cycle
2. Trace the cycle: identify all classes involved and the direction of each dependency
3. Determine if the cycle is direct (A → B → A) or transitive (A → B → C → A)
4. Choose the resolution strategy:
   - **Extract shared dependency**: Create a third class containing the shared logic that both depend on
   - **Event-driven decoupling**: Replace direct circular calls with event dispatch + listener pattern
   - **Lazy injection**: Inject a Closure that resolves the dependency on demand (last resort)
5. Implement the chosen refactoring
6. Verify the cycle is broken: the affected classes resolve without `CircularDependencyException`
7. Run static analysis tools (Deptrac, PHPStan with cycle detection) to confirm no cycles remain
8. Add cycle detection to CI pipeline to prevent future regressions

## Validation Checklist
- [ ] No `CircularDependencyException` occurs during bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] Events/listeners are used instead of direct circular calls where appropriate
- [ ] Class dependencies flow in one direction (high-level → low-level)
- [ ] Static analysis cycle detection runs in CI pipeline
- [ ] No setter injection is used to circumvent constructor cycle detection

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `CircularDependencyException` at resolution | A → B → A dependency chain | Extract shared dependency or use events |
| Cycle hidden but still present | `app()` used inside method to avoid constructor cycle | Remove `app()` call, extract shared dependency |
| Setter injection defers but doesn't fix | Cycle still exists at runtime | Use structural refactoring instead |
| Lazy Closure still causes issues | Cycle not fully broken, just deferred | Re-evaluate: structural refactoring is cleaner |
| Cycle not detected in dev (only production) | Specific resolution path only triggered in production | Add static analysis to CI; trace all resolution paths |

## Decision Points
- **Extract shared dependency vs events**: Use extracted shared class when the cycle is within the same domain and synchronous response needed; use events when the interaction can be asynchronous or cross-domain
- **Lazy injection vs structural refactoring**: Always prefer structural refactoring as the primary fix; use lazy injection (Closure) only when the cycle is genuinely unavoidable (e.g., in framework-level bi-directional dependencies)
- **Static analysis tools**: Use Deptrac for layer-based architecture rules; use PHPStan's cycle detection for class-level dependency analysis

## Performance Considerations
- `$buildStack` tracking adds negligible overhead (array push/pop per resolution)
- `in_array()` check for cycle detection is O(n) on build stack depth (typically 3-10 entries)
- Lazy resolution via Closure adds a small allocation cost
- Main performance cost is debugging time — exception message includes full resolution chain
- Cycle-free graphs resolve deterministically without retries

## Security Considerations
- Circular dependency exceptions expose part of the dependency graph in error messages — disable debug mode in production
- Cycle detection prevents infinite loops (potential DoS via deep recursion)
- Service locator usage to "break" cycles hides the dependency relationship from security audits
- Use events to decouple security-sensitive operations without creating cycles

## Related Rules
- Design Acyclic Dependency Graphs
- Extract Shared Dependencies to Break Cycles
- Use Events to Break Circular Dependencies
- Never Use Service Locator to "Fix" Circular Dependencies
- Never Use Setter Injection to Circumvent Constructor Cycle Detection
- Use Static Analysis Tools to Detect Cycles Before Runtime

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Apply Method Injection for Action-Specific Dependencies
- Manage Service Container Bindings and Resolution

## Success Criteria
- All class dependencies form a Directed Acyclic Graph
- No `CircularDependencyException` occurs during resolution
- No `app()` calls exist that were added to break cycles
- No setter injection is used to circumvent cycle detection
- Static analysis in CI catches any new cycles before deployment
- Shared dependencies are extracted cleanly — no band-aid patterns
