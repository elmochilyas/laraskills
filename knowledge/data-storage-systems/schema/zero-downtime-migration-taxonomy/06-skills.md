# Skill: Select Zero-Downtime Migration Approach by Taxonomy

## Purpose

Choose the correct zero-downtime migration strategy (expand-contract, online DDL, or shadow-table) based on the migration type, database engine, table size, and risk tolerance — matching the approach to the operational context for safe production schema evolution.

## When To Use

- Planning any production schema change on tables receiving live traffic
- Choosing between migration tools for a specific operation
- Assessing rollback safety for a proposed migration

## When NOT To Use

- Maintenance windows where downtime is acceptable
- Tables that can be briefly locked without impact

## Prerequisites

- Understanding of database engine DDL capabilities
- Knowledge of table size and write throughput
- Familiarity with available online DDL tools

## Inputs

- Migration operation type (add column, change type, add index, remove column)
- Database engine and version
- Table size and write throughput
- Available tooling (gh-ost, pt-osc, pgroll)

## Workflow

1. Classify the schema change by operation type and risk level
2. If the operation supports native online DDL (INSTANT, INPLACE), use it for simple changes
3. If the operation requires a table rebuild on a large table, choose a shadow-table tool (gh-ost, pt-osc, pgroll)
4. If the change is complex (rename, type change, multi-table), use the expand-contract pattern
5. For additive changes on small tables, standard DDL during a brief maintenance window is acceptable
6. Always plan a rollback path and test on staging before production

## Validation Checklist

- [ ] Migration approach matches the operation type and risk profile
- [ ] Native online DDL preferred for supported operations
- [ ] Shadow-table tools used for large-table rebuilds
- [ ] Expand-contract used for complex or risky changes
- [ ] Rollback path is documented and tested

## Common Failures

### Blocking ALTER TABLE on large tables
Running `ALTER TABLE ... ALGORITHM=COPY` on a multi-GB table locks the table for minutes or hours. Always check the algorithm before executing.

### Wrong tool for the database engine
Using gh-ost on PostgreSQL or pgroll on MySQL. Each tool is database-specific — match the tool to the engine.

## Decision Points

### Expand-contract vs online DDL?
Expand-contract for complex changes (renames, type changes, multi-table) requiring multiple deployment phases. Online DDL for simple additive changes where the database natively supports non-blocking operations.

### Native vs tool-based?
Native for INSTANT-compatible operations. Tool-based (gh-ost, pt-osc) for operations requiring table rebuild on large tables. Native is simpler; tools are more flexible.

## Performance Considerations

Online DDL consumes IO and CPU during row copying. Expand-contract dual-write doubles write throughput. Shadow-table operations double storage temporarily. Monitor buffer pool and replication lag during any migration.

## Security Considerations

Native online DDL operations may have different behavior across database versions. Always verify version compatibility. Tools require specific database user privileges — use minimal required privileges.

## Related Rules

- Match approach to operation type and risk
- Prefer native online DDL for supported operations
- Plan rollback before execution

## Related Skills

- Execute Zero-Downtime Schema Changes
- Configure MySQL ALGORITHM/LOCK Options
- Select Online Schema Change Tool

## Success Criteria

- Migration approach is correctly matched to the operation
- No production downtime during schema changes
- Rollback path exists and is tested
- Database engine capabilities are fully leveraged
- Table size and write throughput inform tool selection
