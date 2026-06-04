# Skill: Enforce Eloquent Model Ownership Per Bounded Context

## Purpose
Assign every Eloquent model to exactly one bounded context. Reference cross-context data by ID (not by model import). Never use cross-context Eloquent relationships. Use event-based synchronization for local projections. Each database table has exactly one owning context.

## When To Use
- Every multi-context architecture

## When NOT To Use
- Single-context application (no cross-context model access concerns)

## Prerequisites
- Bounded contexts identified (DBC-01)
- Understanding of event-based synchronization

## Inputs
- List of Eloquent models per bounded context
- Cross-context data reference requirements

## Workflow
1. **Assign each Eloquent model to exactly one bounded context.** The owning context runs the migrations and has exclusive write access. Models live in the context's `Models` directory.

2. **Reference cross-context data by ID, not by model import.** Store only the foreign ID as a plain integer. Never import another context's model class. No `use App\Domains\Identity\Models\User` from Billing context.

3. **Never use cross-context Eloquent relationships.** No `belongsTo`, `hasMany`, or `belongsToMany` across context boundaries. Eloquent relationships create implicit schema-level coupling.

4. **Use event-based synchronization for cross-context data.** When context A needs a local copy of context B's data, listen for events from B and update a local projection. Store only the fields needed.

5. **Ensure each database table has exactly one owning context.** No table has multiple contexts performing writes. Write conflicts and undefined migration ordering are the result.

6. **Generate local reference models with only needed fields.** When duplicating cross-context data locally, define a minimal model containing only the fields that context requires.

7. **Use foreign keys only within a context, never across contexts.** Cross-context references are plain integers without FK constraints. Within-context FKs are fine.

8. **Access cross-context data only through service contracts.** Never query another context's tables directly. Use service contracts (interfaces) provided by the owning context.

## Validation Checklist
- [ ] Each model belongs to exactly one bounded context
- [ ] No cross-context model imports (belongsTo, hasMany)
- [ ] Cross-context references use IDs, not foreign keys
- [ ] No shared User model across all contexts
- [ ] Event-based sync for cross-context data duplication
- [ ] Local reference models store only needed fields
- [ ] Foreign keys are within-context only
- [ ] Cross-context data accessed through service contracts

## Common Failures
- **One User model to rule them all.** Single `User` model used by every context — adding a field triggers migrations for all contexts.
- **Cross-context model relationships.** `Invoice belongsTo User` where User is in different context — schema coupling.
- **Direct table access.** Context B reads Context A's table directly — bypasses business logic and authorization.

## Decision Points
- **Local projection vs synchronous contract call?** Local projection (event-synchronized) for frequent reads. Synchronous contract call for real-time accuracy.

## Performance Considerations
- Data duplication (storing email in both Identity and Billing) costs storage but enables independent evolution.
- Event synchronization has eventual consistency latency.

## Security Considerations
- Model ownership provides natural data access boundaries. Each context controls its own schema.
- Direct table access bypasses authorization — always use service contracts.

## Related Rules
- Rule: Each Eloquent model belongs to exactly one bounded context (DBC-05/05-rules.md)
- Rule: Reference cross-context data by ID, not by model (DBC-05/05-rules.md)
- Rule: Never use cross-context Eloquent relationships (DBC-05/05-rules.md)
- Rule: Use event-based synchronization for cross-context data (DBC-05/05-rules.md)
- Rule: Each database table has exactly one owning context (DBC-05/05-rules.md)
- Rule: Generate local reference models with only needed fields (DBC-05/05-rules.md)
- Rule: Use foreign keys only within a context (DBC-05/05-rules.md)
- Rule: Access cross-context data only through service contracts (DBC-05/05-rules.md)

## Related Skills
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Organize Database Schema Per Context (DBC-06/06-skills.md)
- Handle Cross-Context Queries (DBC-07/06-skills.md)
- Design Database Schema Ownership (MMD-13/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

## Success Criteria
- Each Eloquent model lives in exactly one bounded context's directory.
- No cross-context Eloquent relationships or model imports exist.
- Cross-context data references use plain integer IDs without FK constraints.
- Event-based synchronization maintains local projections with only needed fields.
- All cross-context data access goes through service contracts, never direct table reads.
