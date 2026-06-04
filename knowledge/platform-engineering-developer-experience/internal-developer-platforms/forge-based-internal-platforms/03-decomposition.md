# Decomposition: forge based internal platforms

## Topic Overview

Laravel Forge serves as the de facto infrastructure provisioning backend for Laravel IDPs. Its API enables teams to build self-service platforms that automate server creation, site deployment, database provisioning, SSL certificate management, and worker configuration. Forge-based platforms are typically lighter weight than Kubernetes-based IDPs and provide Laravel-specific knowledge (PHP-FPM configuration, queue worker management, scheduled task setup) that generic platforms lack. The patter...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
forge-based-internal-platforms/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### forge based internal platforms
- **Purpose:** Laravel Forge serves as the de facto infrastructure provisioning backend for Laravel IDPs. Its API enables teams to build self-service platforms that automate server creation, site deployment, database provisioning, SSL certificate management, and worker configuration. Forge-based platforms are typically lighter weight than Kubernetes-based IDPs and provide Laravel-specific knowledge (PHP-FPM configuration, queue worker management, scheduled task setup) that generic platforms lack. The patter...
- **Difficulty:** Foundation
- **Dependencies:** idp-architecture-patterns, self-service-environment-provisioning, and automated-deployment-pipelines

## Dependency Graph
**Depends on:** idp-architecture-patterns, self-service-environment-provisioning, and automated-deployment-pipelines
**Depended on by:** Knowledge units that leverage or extend forge based internal platforms patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for forge based internal platforms.
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