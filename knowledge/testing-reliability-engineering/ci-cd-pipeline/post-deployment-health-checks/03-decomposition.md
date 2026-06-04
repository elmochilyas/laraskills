# Decomposition: post deployment health checks

## Topic Overview

Post-deployment health checks validate that a Laravel application is functioning correctly after deployment to production or staging. These checks run after the deployment pipeline and before traffic is fully routed to the new deployment. They include HTTP status monitoring, database connectivity verification, queue worker responsiveness, cache connectivity, and key business transaction smoke tests. Health checks serve as the final quality gate between deployment and full production traffic, ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
post-deployment-health-checks/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### post deployment health checks
- **Purpose:** Post-deployment health checks validate that a Laravel application is functioning correctly after deployment to production or staging. These checks run after the deployment pipeline and before traffic is fully routed to the new deployment. They include HTTP status monitoring, database connectivity verification, queue worker responsiveness, cache connectivity, and key business transaction smoke tests. Health checks serve as the final quality gate between deployment and full production traffic, ...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Laravel routing and middleware, Deployment strategies, Load balancer concepts, **Related Topics**: Zero-downtime deployment, CI/CD pipeline design, Graceful degradation patterns, **Advanced Follow-up**: Kubernetes liveness/readiness probes for Laravel, Health check aggregation for microservices, and Synthetic transaction monitoring

## Dependency Graph
**Depends on:** **Prerequisites**: Laravel routing and middleware, Deployment strategies, Load balancer concepts, **Related Topics**: Zero-downtime deployment, CI/CD pipeline design, Graceful degradation patterns, **Advanced Follow-up**: Kubernetes liveness/readiness probes for Laravel, Health check aggregation for microservices, and Synthetic transaction monitoring
**Depended on by:** Knowledge units that leverage or extend post deployment health checks patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for post deployment health checks.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization