# ECC Anti-Patterns — Choreography vs Orchestration

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **Choreographed Circular Dependencies** — Events causing infinite loops between services
2. **Orchestrator as God Service** — Single orchestrator knowing all business logic
3. **Wrong Abstraction Chosen** — Choreography for complex workflows, orchestration for simple ones
4. **No Observability in Choreography** — Cannot trace event chains, debugging impossible
5. **Orchestrator Single Point of Failure** — Central coordinator crashes = entire workflow stops
6. **Mixed Coordination Style** — Choreography and orchestration mixed without clear boundaries

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Choreographed Circular Dependencies

**Category:** Architecture

**Description:** Event A triggers Service B, which emits Event C, which triggers Service A again — forming a loop.

**Why It Happens:** Events designed without tracing event causality chains.

**Warning Signs:** Infinite event loops in production; events that trigger their own source service.

**Why Is It Harmful:** Infinite loops consume resources. System can crash from event explosion.

**Preferred Alternative:** Design event chains as acyclic graphs. Use correlation IDs to detect loops.

**Refactoring Strategy:** Add loop detection (correlation ID tracing). Restructure to remove circular chains.

**Related Rules:** Design acyclic event chains (05-rules.md)

---

### Anti-Pattern 2: Orchestrator as God Service

**Category:** Architecture

**Description:** Orchestrator contains knowledge of all services' internal logic.

**Why It Happens:** Orchestrator written as "brain" that tells each service exactly what to do.

**Warning Signs:** Orchestrator contains business logic that belongs in individual services.

**Why Is It Harmful:** Orchestrator becomes god class. Changes to any service require orchestrator changes.

**Preferred Alternative:** Orchestrator coordinates, not dictates. Services own their business logic.

**Refactoring Strategy:** Move business logic from orchestrator to services. Orchestrator only routes and tracks state.

**Related Rules:** Keep orchestrator thin, services smart (05-rules.md)

---

### Anti-Pattern 3: Wrong Abstraction Chosen

**Category:** Architecture

**Description:** Choreography for complex branching workflows; orchestration for simple linear ones.

**Why It Happens:** Aesthetic preference rather than fitness-for-purpose.

**Warning Signs:** Complex workflow with 10+ branching paths using only events — impossible to trace.

**Why Is It Harmful:** Choreography becomes unmanageable at scale. Simple flow with orchestrator adds unnecessary ceremony.

**Preferred Alternative:** Choreography for simple linear flows; orchestration for complex branching.

**Refactoring Strategy:** Refactor complex event chains to orchestrator. Simplify orchestrator-only flows to events.

**Related Rules:** Match coordination style to workflow complexity (05-rules.md)

---

### Anti-Pattern 4: No Observability in Choreography

**Category:** Operations

**Description:** Event-driven system with no tracing, logging, or monitoring of event chains.

**Why It Happens:** Choreography seen as "fire and forget" — no investment in observability.

**Warning Signs:** Cannot answer "what happened to this event?"; production issues require log spelunking.

**Why Is It Harmful:** Debugging nearly impossible. Blind to failures. Eventual consistency issues undetected.

**Preferred Alternative:** Implement distributed tracing with correlation IDs across event chains.

**Refactoring Strategy:** Add correlation ID to every event. Implement centralized event log. Add tracing (OpenTelemetry).

**Related Rules:** Add observability to event chains (05-rules.md)

---

### Anti-Pattern 5: Orchestrator Single Point of Failure

**Category:** Reliability

**Description:** Central orchestrator crashes stops all workflow processing.

**Why It Happens:** Orchestrator deployed as single instance without redundancy.

**Warning Signs:** Orchestrator downtime stops all business operations; no failover.

**Why Is It Harmful:** Complete system outage if orchestrator fails. Availability limited to single instance.

**Preferred Alternative:** Deploy orchestrator with redundancy (multiple instances, persistent state).

**Refactoring Strategy:** Make orchestrator stateless (state in DB). Deploy multiple instances behind load balancer.

**Related Rules:** Make orchestrator stateless and redundant (05-rules.md)

---

### Anti-Pattern 6: Mixed Coordination Style

**Category:** Architecture

**Description:** Choreography and orchestration mixed without clear boundaries or reasoning.

**Why It Happens:** No explicit decision about coordination style per workflow.

**Warning Signs:** Some workflows partially event-driven, partially orchestrated; no clear pattern.

**Why Is It Harmful:** Hard to understand system behavior. Both patterns' disadvantages manifest without clear benefits.

**Preferred Alternative:** Choose one style per workflow. Use explicit boundary where styles mix.

**Refactoring Strategy:** Per workflow, pick one style. Apply consistently within each workflow boundary.

**Related Rules:** Apply consistent coordination per workflow (05-rules.md)
