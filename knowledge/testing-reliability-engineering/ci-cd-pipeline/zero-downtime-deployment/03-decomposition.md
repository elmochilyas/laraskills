# Decomposition: zero downtime deployment

## Topic Overview

Zero-downtime deployment for Laravel applications updates production code without interrupting service to users. The primary tools are Deployer (PHP deployment tool) and Laravel Forge hooks, with strategies including blue/green deployment, rolling updates, and pre-warmed cache deployments. The critical challenges are database migration compatibility (old code running alongside new schema), queue job compatibility during deployment, and session/cache invalidation. Zero-downtime deployment requ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
zero-downtime-deployment/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### zero downtime deployment
- **Purpose:** Zero-downtime deployment for Laravel applications updates production code without interrupting service to users. The primary tools are Deployer (PHP deployment tool) and Laravel Forge hooks, with strategies including blue/green deployment, rolling updates, and pre-warmed cache deployments. The critical challenges are database migration compatibility (old code running alongside new schema), queue job compatibility during deployment, and session/cache invalidation. Zero-downtime deployment requ...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Linux server administration, Nginx/Apache configuration, Database migration patterns, **Related Topics**: Post-deployment health checks, CI/CD pipeline design, Queue management with Horizon, **Advanced Follow-up**: Docker-based Laravel deployment, Kubernetes deployment for Laravel, and Blue/green infrastructure automation

## Dependency Graph
**Depends on:** **Prerequisites**: Linux server administration, Nginx/Apache configuration, Database migration patterns, **Related Topics**: Post-deployment health checks, CI/CD pipeline design, Queue management with Horizon, **Advanced Follow-up**: Docker-based Laravel deployment, Kubernetes deployment for Laravel, and Blue/green infrastructure automation
**Depended on by:** Knowledge units that leverage or extend zero downtime deployment patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for zero downtime deployment.
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