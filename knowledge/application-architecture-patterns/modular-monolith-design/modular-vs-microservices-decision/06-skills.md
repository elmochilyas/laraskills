# Skill: Decide Between Modular Monolith and Microservices Using a Decision Framework

## Purpose
Choose between modular monolith and microservices based on team size, organizational structure, resource patterns, and deployment requirements. Use Conway's Law as guidance and document the decision in an ADR with specific rationale.

## When To Use
- Architecture planning at project inception
- Evaluating whether an existing modular monolith should extract to microservices

## When NOT To Use
- When the decision has already been made and cannot be revisited
- When organizational constraints (not technical) drive the decision without evaluation

## Prerequisites
- Team size and organizational structure understood
- Understanding of Conway's Law
- Knowledge of modular monolith vs microservice tradeoffs

## Inputs
- Team size and structure
- Organizational communication patterns
- Resource usage data per module (if available)
- Deployment cadence requirements
- Compliance/regulatory requirements

## Workflow
1. **Default to modular monolith for teams under 30 engineers.** The modular monolith is a valid end-state architecture, not a temporary state. It provides domain isolation without distribution costs.

2. **Assess organizational structure using Conway's Law.** If your team structure is one team that communicates frequently, use one deployment (modular monolith). If you have multiple independent teams, consider multiple deployments.

3. **Assess the cost of distribution before adopting microservices.** Calculate expected cost: 3-5x operational complexity, 2-3x latency, 2x CI infrastructure, 3x monitoring surface area. Ensure business benefit exceeds this cost.

4. **Track module-level resource usage before considering extraction.** Monitor CPU, memory, query volume per module. Only consider extraction when a module's resource profile diverges significantly from the rest.

5. **Avoid the distributed monolith anti-pattern.** Never create microservices that share a database or have synchronous call chains creating deployment coupling. Each service must own its data.

6. **Do not treat the modular monolith as a "not yet microservices" state.** Design the modular monolith as a permanent architecture. Extraction is possible when needed, but it's not the goal.

7. **Document the architecture decision in an ADR.** Include team size, organizational structure, scaling needs, deployment requirements, and specific rationale. This prevents future confusion about why the choice was made.

## Validation Checklist
- [ ] Team size informs the architecture decision (<30 = modular monolith, >50 = consider microservices)
- [ ] Conway's Law was considered (organizational structure matches software structure)
- [ ] Cost of distribution was assessed before microservices decision
- [ ] Module resource usage is monitored (for extraction decisions)
- [ ] Distributed monolith anti-pattern is avoided
- [ ] Modular monolith is treated as a valid end-state, not temporary
- [ ] Architecture decision is documented in an ADR with specific rationale

## Common Failures
- **Microservices for "future-proofing."** Building microservices before needed — adds complexity without benefit.
- **Microservices for "scalability."** Assuming microservices are needed for scale — a well-optimized monolith handles millions of users.
- **Modular monolith as temporary state.** Treating modular monolith as "not yet microservices" — leads to underinvesting in module quality.
- **Distributed monolith.** Microservices sharing a database — worst of both worlds.

## Decision Points
- **Modular monolith vs microservices for 30-50 person teams?** Evaluate based on organizational coupling needs — do sub-teams need independent deployability?

## Performance Considerations
- Modular monolith: in-process calls (µs), single DB connection pool, uniform scaling.
- Microservices: network calls (ms), N connection pools, independent scaling.
- For latency-sensitive operations, modular monolith wins.

## Security Considerations
- Modular monolith: single security context, centralized auth.
- Microservices: distributed security, each service needs auth, inter-service communication must be encrypted/authenticated.

## Related Rules
- Rule: Start with Modular Monolith (MMD-17/05-rules.md)
- Rule: Team Size as Primary Factor (MMD-17/05-rules.md)
- Rule: Track Module Resource Usage (MMD-17/05-rules.md)
- Rule: Assess Cost of Distribution (MMD-17/05-rules.md)
- Rule: Avoid Distributed Monolith (MMD-17/05-rules.md)
- Rule: Use Conway's Law (MMD-17/05-rules.md)
- Rule: Modular Monolith as End-State (MMD-17/05-rules.md)
- Rule: Document Decision in ADR (MMD-17/05-rules.md)

## Related Skills
- Decide Module vs Microservice (MMD-01/06-skills.md)
- Extract Module to Microservice (MMD-11/06-skills.md)
- Apply Strangler Fig Pattern (DBC-10/06-skills.md)
- Map Team to Context (DBC-09/06-skills.md)

## Success Criteria
- Architecture decision (modular monolith or microservices) is documented in an ADR with specific, measurable rationale.
- Team size and organizational structure inform the decision.
- Cost of distribution was assessed before choosing microservices.
- The modular monolith is treated as a valid end-state architecture.
