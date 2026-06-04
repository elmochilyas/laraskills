# Skill: Handle Cross-Module Data Access Without SQL JOINs

## Purpose
Access data owned by other modules without SQL JOINs, Eloquent relationships, or direct database queries. Use service contracts for real-time data, event projections for frequent reads, and assemble results in application code.

## When To Use
- Module A needs data owned by Module B
- Any modular monolith with 2+ modules

## When NOT To Use
- Data owned by the same module (direct query is fine)
- No inter-module data access needed yet

## Prerequisites
- Module boundaries established
- Contract interfaces for synchronous communication
- Event system for async communication

## Inputs
- Data needed from other modules
- Freshness requirements (real-time vs eventual consistency)
- Read frequency per data point

## Workflow
1. **Identify cross-module data needs.** Scan the codebase for queries referencing tables, models, or data owned by other modules. Each such need is a candidate for a contract or event pattern.

2. **Use service contracts for real-time data.** When the consumer must have current data, define a contract method in the providing module. Call the contract and accept the latency of the in-process call.

3. **Use event projections for frequent reads.** When a module reads another module's data frequently (list views, dashboards), build a local projection table/Redis cache. Update it via the providing module's events.

4. **Assemble cross-module results in application code.** Never use SQL JOINs across module tables. Fetch each module's data through its contract and assemble in an orchestrator or query object.

5. **Never define Eloquent relationships across module boundaries.** Do not use `belongsTo`, `hasMany`, etc. referencing models in other modules. Store foreign IDs directly and resolve via contract calls.

6. **Enforce cross-module data access with database-level permissions.** Create separate database users per module or use schema-level permissions. The database should reject cross-module queries even if code allows them.

7. **Monitor projection freshness.** Alert when event projections are stale beyond a defined threshold. Stale projections cause data inconsistency bugs.

## Validation Checklist
- [ ] No cross-module SQL JOINs exist in the codebase
- [ ] No Eloquent relationships reference other module's tables
- [ ] Real-time cross-module data uses service contracts
- [ ] Frequent reads use event projections
- [ ] Cross-module results assembled in application code
- [ ] Database-level permissions restrict per-module table access
- [ ] Projection freshness is monitored with alerts

## Common Failures
- **Direct JOINs.** A single `->join('other_module_tables', ...)` defeats module isolation. Fix: use service call or projection.
- **Shared database user.** All modules connecting with same user having access to all tables. Fix: per-module credentials.
- **Eloquent relationships across modules.** `belongsTo` referencing another module's model. Fix: store foreign IDs, resolve via contract.

## Decision Points
- **Service call vs event projection?** Service call for real-time data (must be current). Event projection for frequent reads where eventual consistency is acceptable.
- **Batch vs single calls?** Batch (request all needed data at once) avoids cross-module N+1 problems.

## Performance Considerations
- Application-level assembly is slower than a single SQL JOIN — typically 5-50ms per operation.
- Cross-module N+1: calling a service for each item in a list. Mitigate with batch endpoints or local projections.
- Local projections consume storage but eliminate repeated cross-module calls.

## Security Considerations
- No security isolation — authorization still at application level.
- Shared database user with all-table access invalidates enforcement. Use per-module credentials.

## Related Rules
- Rule: Never JOIN Across Module Tables (MMD-10/05-rules.md)
- Rule: No Cross-Module Eloquent Relationships (MMD-10/05-rules.md)
- Rule: Service Calls for Real-Time Data (MMD-10/05-rules.md)
- Rule: Event Projections for Frequent Reads (MMD-10/05-rules.md)
- Rule: Monitor Projection Freshness (MMD-10/05-rules.md)
- Rule: Database-Level Permissions (MMD-10/05-rules.md)
- Rule: Assemble Results in App Code (MMD-10/05-rules.md)

## Related Skills
- Manage Sync Inter-Module Communication (MMD-06/06-skills.md)
- Manage Async Inter-Module Communication (MMD-07/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)

## Success Criteria
- No cross-module SQL JOINs or Eloquent relationships exist.
- All cross-module data access uses contracts, events, or projections.
- Database-level permissions enforce table ownership.
- Projection freshness is monitored with alerts.
