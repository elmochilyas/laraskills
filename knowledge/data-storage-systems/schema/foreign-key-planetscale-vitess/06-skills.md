# Skill: Handle Foreign Key Constraints in Vitess/PlanetScale Environments

## Purpose

Adapt FK constraint usage for Vitess-based platforms (PlanetScale) where cross-shard FK enforcement is limited or unsupported, by omitting database-level FK constraints, implementing referential integrity at the application layer via Eloquent events, and ensuring related tables share shard keys for co-location.

## When To Use

- Deploying Laravel on PlanetScale or standalone Vitess
- Multi-shard database environments
- Any Vitess deployment without FK support across shards

## When NOT To Use

- Single-node MySQL where database-level FKs are supported
- Co-located shards where FKs work correctly

## Prerequisites

- Understanding of Vitess FK limitations
- Awareness of PlanetScale branching workflow
- Application-level referential integrity implementation

## Inputs

- Relationship definitions
- Shard key for co-location
- Cascade/cleanup logic

## Workflow

1. Omit `->constrained()` from migrations — do not create database-level FK constraints
2. Use `foreignId('user_id')` without `->constrained()` — just the column, no FK
3. Implement referential integrity in application code: use Eloquent relationships for querying, manual cleanup via model events
4. For cascade deletes, use `deleting` model events to clean up related records
5. Ensure related tables share the same shard key for Vitess co-location
6. For PlanetScale, use the deploy request workflow for all schema changes

## Validation Checklist

- [ ] No `->constrained()` in migration files for Vitess deployments
- [ ] Application-level cleanup handles related records on delete
- [ ] Related tables share shard keys for co-location
- [ ] Cascade operations are implemented in app code, not DB
- [ ] PlanetScale deploy request workflow is used for schema changes

## Common Failures

### Assuming FK cascade works in Vitess
CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted. Always implement cascade in application code.

### Relying on FK for data integrity
In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records.

## Decision Points

### Database-level vs application-level FKs?
Application-level for Vitess/PlanetScale. Database-level for single-node MySQL. Never mix both — inconsistent enforcement causes confusion.

### Eloquent events vs manual cleanup?
Use Eloquent `deleting` events for simple cascade relationships. Use queue jobs for complex multi-table cleanup that may require cross-shard coordination.

## Performance Considerations

FK enforcement in Vitess goes through VTGate, adding latency compared to direct MySQL enforcement. Disabling FK checks entirely (`SET FOREIGN_KEY_CHECKS=0`) shifts integrity to the application. Batch operations should be chunked to avoid overwhelming VTGate.

## Security Considerations

Without database-level FK enforcement, application bugs can create orphaned records or inconsistent data. Implement comprehensive testing for referential integrity. Consider periodic data integrity audits.

## Related Rules

- Omit constrained() in Vitess migrations
- Implement cascade in application code
- Co-locate related tables on the same shard

## Related Skills

- Define Foreign Key Constraints
- Orchestrate Migrations Across Multi-Tenant Databases
- Manage Cross-Branch Migration Conflicts

## Success Criteria

- No database-level FK constraints in Vitess deployments
- Application-level cleanup handles all cascade scenarios
- Related tables are co-located via shared shard keys
- PlanetScale deploy request workflow is followed
- Data integrity audits confirm no orphaned records
