# Chain of Responsibility — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Chain of Responsibility pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Handler Modifying Passable in Unexpected Ways | High |
| 2 | Handler Return Type Inconsistency | High |
| 3 | Forgetting to Call $next($passable) | Critical |
| 4 | Heavy Logic in Frequently-Skipped Handler | Medium |
| 5 | Handler Depending on Previous Handler's Side Effects | High |

---

## 1. Handler Modifying Passable in Unexpected Ways

### Category
Architecture

### Description
A middleware or pipeline handler mutates the passable object (request, data) in ways that break assumptions of subsequent handlers in the chain.

### Why It Happens
Handlers are tested in isolation. The cumulative effect of multiple handlers modifying the same passable is not tested end-to-end.

### Warning Signs
- Handler modifying `$request` properties unexpectedly
- Subsequent handlers failing or behaving differently due to upstream changes
- Hidden coupling between handlers through shared mutable state
- Order-dependent bugs

### Why Harmful
Chain of Responsibility works because handlers are independent. State mutation creates implicit coupling. Changing handler order or adding new handlers causes unexpected failures.

### Consequences
- Order-dependent behavior
- Hidden coupling between handlers
- Brittle pipeline configuration
- Hard-to-debug failures

### Alternative
Handlers should pass-through or wrap the passable, not mutate it. If mutation is necessary, document the changed property and test the full pipeline.

### Refactoring Strategy
1. Identify handlers that modify passable
2. Document or remove mutation
3. Use immutable passable (clone before modification)
4. Add full-pipeline integration tests
5. Formalize passable contract

### Detection Checklist
- [ ] Review handlers for passable mutation
- [ ] Test full pipeline end-to-end
- [ ] Check for order-dependent behavior

### Related Rules/Skills/Trees
- Skills: Chain of Responsibility, Middleware
- Decision Trees: Pipeline Handler Design

---

## 2. Handler Return Type Inconsistency

### Category
Reliability

### Description
Some handlers return a response (short-circuiting the chain) while others pass to `$next`, creating confusion about return type expectations.

### Why It Happens
Middleware in Laravel can either return `$next($request)` or return a response. Inconsistent patterns make pipeline behavior unpredictable.

### Warning Signs
- Handlers returning mixed types (response vs next)
- Callers unsure whether chain completed
- Some handlers always return response, others never do
- Pipeline behavior depends on handler order

### Why Harmful
Inconsistent return types make the pipeline unpredictable. Some requests may be short-circuited early, others processed fully, depending on handler conditions.

### Consequences
- Unpredictable pipeline execution
- Hard to reason about behavior
- Testing complexity
- Order-dependent results

### Alternative
Clearly define the pipeline contract: either all handlers pass through (modify and continue) or some terminate (return response). Document which handlers may short-circuit.

### Refactoring Strategy
1. Classify handlers as pass-through or terminating
2. Document termination conditions
3. Consider splitting into two pipelines (before/after)
4. Add pipeline flow tests

### Detection Checklist
- [ ] Review handler return types
- [ ] Identify termination conditions
- [ ] Test short-circuit behavior

### Related Rules/Skills/Trees
- Skills: Chain of Responsibility, Middleware
- Decision Trees: Pipeline Handler Design

---

## 3. Forgetting to Call $next($passable)

### Category
Reliability

### Description
Handler omits the `$next($passable)` call, silently terminating the chain without returning a response or indicating failure.

### Why It Happens
Copy-paste errors, missing return statement, or logic branches that exit without calling `$next`.

### Warning Signs
- Handler with branches where `$next` is not called
- Chain silently shorter than configured
- Requests seemingly processed but missing handler effects
- Handler missing `return $next($request)` in some path

### Why Harmful
The chain silently stops processing. Downstream handlers don't run. No response is returned (Laravel throws an error, but custom pipelines may not).

### Consequences
- Broken pipeline
- Missing handler effects
- Response errors
- Hard-to-diagnose silent failures

### Alternative
Call `$next($passable)` in every code path, or ensure at least one path returns a response. Use early returns with guard conditions.

### Refactoring Strategy
1. Review each handler for missing `$next` calls
2. Add guard pattern: if condition → return response; else → return $next()
3. Add pipeline tests verifying all handlers execute
4. Use static analysis to detect missing calls

### Detection Checklist
- [ ] Check all handler code paths for `$next`
- [ ] Test handler execution count
- [ ] Verify coverage of all branches

### Related Rules/Skills/Trees
- Skills: Chain of Responsibility, Middleware

---

## 4. Heavy Logic in Frequently-Skipped Handler

### Category
Performance

### Description
A handler that is often skipped (early return) executes expensive setup logic before the skip check, paying the cost even when not needed.

### Why It Happens
Handler initialization or early logic is executed before the short-circuit check.

### Warning Signs
- Handler with DB/cache/API calls before skip condition
- Skip condition checked late in handler method
- Performance cost paid even when handler does nothing
- Slow requests traced to skipped handlers

### Why Harmful
The performance benefit of short-circuiting is lost. The handler's overhead is paid regardless of whether its logic is needed.

### Consequences
- Unnecessary performance cost
- Wasted I/O for skipped handlers
- Slower request processing
- Misleading optimization assumptions

### Alternative
Check skip conditions first. Return early before performing expensive operations. Defer expensive initialization until after the pass-through decision.

### Refactoring Strategy
1. Move skip conditions to handler start
2. Add early return before expensive logic
3. Use guard clause pattern
4. Benchmark before/after

### Detection Checklist
- [ ] Check handler logic order (skip condition placement)
- [ ] Measure skipped handler overhead
- [ ] Profile handler execution time

### Related Rules/Skills/Trees
- Skills: Chain of Responsibility, Pipeline Optimization

---

## 5. Handler Depending on Previous Handler's Side Effects

### Category
Architecture

### Description
A handler assumes a previous handler in the chain has already performed specific modifications or setup, creating implicit coupling between handlers.

### Why It Happens
Handlers added over time. Each new handler relies on the work of existing handlers without formal documentation.

### Warning Signs
- Handler fails when another handler is removed or reordered
- Comments like "must run after X middleware"
- Handler reading properties set by upstream handlers
- Pipeline configuration order documented as critical

### Why Harmful
Order becomes a hidden dependency. Changing handler order breaks things. Adding handlers between them causes failures.

### Consequences
- Implicit coupling
- Brittle pipeline order
- Hidden dependencies
- Maintenance difficulty

### Alternative
Handlers should be independent and self-contained. If state sharing is needed, formalize it through the passable contract (documented properties) and test the full pipeline.

### Refactoring Strategy
1. Identify handler dependencies on upstream state
2. Document passable contract formally
3. Make each handler self-contained
4. Add integration tests verifying handler independence
5. Consider merging tightly-coupled handlers

### Detection Checklist
- [ ] Check handlers for upstream dependency
- [ ] Verify handler order tolerance
- [ ] Test pipeline with different orderings

### Related Rules/Skills/Trees
- Skills: Chain of Responsibility, Middleware Architecture
- Decision Trees: Middleware Dependencies
