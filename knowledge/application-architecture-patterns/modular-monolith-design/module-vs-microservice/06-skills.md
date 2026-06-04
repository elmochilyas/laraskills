# Skill: Decide Between Modular Monolith and Microservices

## Purpose
Evaluate whether to start with a modular monolith or microservices for a Laravel project, based on team size, resource requirements, and organizational constraints. Default to modular monolith and extract only when justified.

## When To Use
- Starting a new Laravel project
- Evaluating whether to extract existing modules to microservices
- Architecture planning at project inception

## When NOT To Use
- Project already successfully deployed with microservices — don't force-migrate to monolith
- Single-developer hobby project (Laravel default structure suffices)

## Prerequisites
- Understanding of modules (logical boundaries) vs microservices (network boundaries)
- Team size estimate and organizational structure
- Preliminary module boundary identification

## Inputs
- Team size and composition
- Projected resource requirements per domain
- Organizational constraints (team independence, deployment autonomy)
- Regulatory requirements (PCI, HIPAA, data isolation)

## Workflow
1. **Default to modular monolith for teams under 30 engineers.** Modules provide domain isolation without distribution costs (single CI, single deploy, single monitoring surface). Document this decision in an ADR.

2. **Extract to microservice only when specific constraints are measurable.** Track per-module resource usage (CPU, memory, connections). Extract only when a module's resource requirements diverge significantly from the rest.

3. **Design modules as extraction-ready from the start.** Define explicit contracts for inter-module communication, own database schema per module, and avoid shared Eloquent models. This makes future extraction straightforward.

4. **Enforce module boundaries with architecture tests, not just folder conventions.** Write Pest architecture tests that prevent cross-module imports, shared model usage, and cross-module table access.

5. **Respect the 100-1000x latency difference.** Keep latency-sensitive operations in-process via contracts. Move to async events for non-critical cross-module notifications.

6. **Separate databases on extraction.** When extracting a module to microservice, give it its own database immediately. Shared databases defeat the purpose of microservices and create a distributed monolith.

7. **Document the decision with team-size threshold.** Write an ADR explaining the module/microservice decision, including team size, resource analysis, and planned extraction triggers.

## Validation Checklist
- [ ] Modular monolith is the default unless specific constraints require microservices
- [ ] Module extraction readiness is built in (contracts, schema ownership, no shared models)
- [ ] Architecture tests enforce module boundaries in CI
- [ ] Module vs microservice decision is documented with rationale
- [ ] Team-size threshold is acknowledged (<30 = modular monolith, >50 = consider microservices)

## Common Failures
- **Premature microservices.** Building multiple services for a team <15 engineers. 40%+ of microservice implementations should have remained monoliths.
- **Module as folder, not boundary.** Creating directories without enforcement degrades into a big ball of mud.
- **Distributed monolith.** Microservices sharing the monolith's database — worst of both worlds.

## Decision Points
- **Extract when resource requirements diverge vs extract when team independence needed?** Resource divergence for technical extraction; organizational independence also justifies extraction.

## Performance Considerations
- Module calls: microseconds (function calls). Microservice calls: milliseconds (HTTP requests). 100-1000x difference.
- Modules are strongly preferable for latency-sensitive operations.

## Security Considerations
- Module boundaries are code conventions — no network-level security isolation.
- Microservices provide stronger security boundaries via network separation.

## Related Rules
- Rule: Start with Modular Monolith; Extract When Justified (MMD-01/05-rules.md)
- Rule: Design Modules as Extraction-Ready (MMD-01/05-rules.md)
- Rule: Enforce Boundaries as Runtime Constraints (MMD-01/05-rules.md)
- Rule: Use Contracts, Not Direct Imports (MMD-01/05-rules.md)
- Rule: Respect 100-1000x Latency Difference (MMD-01/05-rules.md)
- Rule: Extract Only When Resource Requirements Diverge (MMD-01/05-rules.md)
- Rule: Separate Databases on Extraction (MMD-01/05-rules.md)
- Rule: Respect Team-Size Threshold (MMD-01/05-rules.md)

## Related Skills
- Identify Module Boundaries (MMD-02/06-skills.md)
- Implement Module Internal Structure (MMD-03/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

## Success Criteria
- Modular monolith is the default architecture for teams under 30 engineers.
- Module boundaries are enforced by architecture tests, not folder conventions.
- Extraction-readiness is built in from day one.
- The team-size threshold and extraction triggers are documented in an ADR.
