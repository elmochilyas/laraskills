# Skill: Choose and Implement Cache Invalidation Consistency Model Per Service

## Purpose
Select the appropriate consistency model (strong via blue-green with atomic cutover, or eventual via rolling deployment with per-worker invalidation) for each service based on write/read intensity, apply backward-compatible schema changes before code deployments, configure sticky sessions for eventual-consistency deployments, and document the chosen model — preventing data corruption in write-heavy services and avoiding unnecessary 2x infrastructure cost for read-heavy ones.

## When To Use
- Planning deployment strategy for a new service
- Evaluating current deployment architecture for consistency gaps
- Designing CI/CD pipeline for multi-instance PHP deployments
- When mixed-version execution tolerance needs explicit documentation

## When NOT To Use
- Single-server deployments (no consistency model needed — single version)
- Development/staging environments
- Services still in design phase without clear consistency requirements

## Prerequisites
- Understanding of service write/read patterns
- Load balancer supporting sticky sessions (for eventual consistency)
- Infrastructure for blue-green deployment (for strong consistency)

## Inputs
- Service criticality classification (write-heavy, read-heavy, mixed)
- Infrastructure budget for blue-green ($2x cost)
- Deployment frequency and rollback requirements

## Workflow

### 1. Classify Service by Write/Read Intensity
- Write-heavy (payment, auth, data mutation): prefer strong consistency
- Read-heavy (catalog, product listings): eventual consistency is acceptable
- Mixed: default to strong consistency unless infrastructure budget is constrained

### 2. Choose Consistency Model
- Strong consistency: blue-green with atomic traffic cutover. 2x infrastructure cost. No mixed-version window. Instant rollback.
- Eventual consistency: rolling deployment with per-instance warm-up. No extra infrastructure. Mixed versions during transition. Requires backward-compatible code.

### 3. Document the Chosen Model
- Explicitly document in deployment configuration: `CONSISTENCY_MODEL: strong` or `eventual`
- Operations team must understand the implications
- Include rollback strategy aligned with consistency model

### 4. Apply Schema Changes Before Code Changes
- Schema changes must always precede code changes in the pipeline
- Deploy schema → verify → deploy code
- Old workers must work with new schema during rolling deployments
- Schema changes must be additive (new columns/tables, never destructive)

### 5. Configure Sticky Sessions for Eventual Consistency
- Enable `ip_hash` or cookie-based session affinity on load balancer
- Ensures user requests hit the same version throughout their session
- Prevents inconsistent behavior from bouncing between old and new instances

### 6. Test Mixed-Version Operation in Staging
- For eventual consistency: test that old and new code work together
- Run integration tests against mixed pool of old and new instances
- Verify backward compatibility before production deployment

## Validation Checklist
- [ ] Consistency model chosen and documented per service
- [ ] Schema changes applied before code changes
- [ ] Sticky sessions configured for eventual consistency
- [ ] Mixed-version operation tested in staging
- [ ] Rollback plan aligned with consistency model
- [ ] Deployment automation enforces the chosen model

## Related Rules
- Document consistency model per service (`05-rules.md:5`)
- Strong for writes, eventual for reads (`05-rules.md:41`)
- Schema changes before code (`05-rules.md:75`)
- Sticky sessions for eventual consistency (`05-rules.md:107`)
- OpCache invalidation is per-instance (`05-rules.md:141`)
- Test mixed-version in staging (`05-rules.md:171`)

## Related Skills
- Blue-Green Deployment OpCache
- Zero-Downtime Deployment OpCache
- Multi-Instance Cache Coordination
- Rollback Planning and Version Mismatch

## Success Criteria
- Consistency model documented for every production service
- Write-heavy services use strong consistency (blue-green)
- Read-heavy services use eventual consistency with sticky sessions
- Schema changes applied before code changes in all pipelines
- Mixed-version operation tested in staging
- Deployment automation enforces the chosen model
