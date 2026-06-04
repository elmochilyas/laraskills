# Decomposition: Laravel Vapor

## Topic Overview
Laravel Vapor is a serverless deployment platform for Laravel powered by AWS Lambda. It abstracts the complexity of running Laravel on AWS Lambda by managing API Gateway, SQS queues, RDS databases, ElastiCache, CloudFront CDN, and IAM roles behind a single `vapor.yml` configuration file and CLI command. Vapor creates two Lambda functions per project (HTTP and CLI) to separate request handling from background jobs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-vapor/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Vapor
- **Purpose:** Laravel Vapor is a serverless deployment platform for Laravel powered by AWS Lambda.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Cloud (KU-016) — next-gen Vapor alternative built on K8s, Bref Serverless PHP (KU-017) — open-source alternative, CI/CD Pipelines (KU-008/009) — Vapor deploy in CI, Database Deployment & Migration (KU-019/020), Environment & Secret Management (KU-021)

## Dependency Graph
**Depends on:**
- Laravel Cloud (KU-016) — next-gen Vapor alternative built on K8s
- Bref Serverless PHP (KU-017) — open-source alternative
- CI/CD Pipelines (KU-008/009) — Vapor deploy in CI
- Database Deployment & Migration (KU-019/020)
- Environment & Secret Management (KU-021)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- HTTP Lambda:
- CLI Lambda:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Cloud (KU-016) — next-gen Vapor alternative built on K8s, Bref Serverless PHP (KU-017) — open-source alternative, CI/CD Pipelines (KU-008/009) — Vapor deploy in CI, Database Deployment & Migration (KU-019/020), Environment & Secret Management (KU-021)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization