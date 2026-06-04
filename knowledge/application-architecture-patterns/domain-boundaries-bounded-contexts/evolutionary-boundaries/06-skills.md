# Skill: Split a Monolithic Model into Bounded Contexts Incrementally

## Purpose
Split a monolithic model into bounded contexts incrementally, guided by concrete pain. Use parallel implementation (old and new coexist). Keep the old model as a facade during migration. Extract the most independent concept first. Use Strangler Fig pattern for feature-by-feature extraction.

## When To Use
- Concrete pain exists: bugs from model confusion, team coordination overhead, change conflict frequency

## When NOT To Use
- Model is cohesive (all parts change together) and single team owns it
- Splitting would add complexity without benefit

## Prerequisites
- Bounded contexts identified for extraction
- Concrete pain signals documented

## Inputs
- Monolithic model to be split
- Priority-ordered list of concepts to extract

## Workflow
1. **Split incrementally, not via big-bang rewrite.** Extract one concept at a time. Each extraction is independently deployable and reversible. Never attempt a full split in a single effort.

2. **Use parallel implementation during migration.** Build the new context alongside the old monolithic model. Both coexist until all consumers are migrated. No downtime.

3. **Keep the old model as a facade during migration.** Convert the old monolithic model into a facade that delegates to the new context(s). Existing consumers keep working without changes.

4. **Split based on concrete pain, not theoretical purity.** Only split when there is measurable pain — frequent bugs, team coordination overhead, conflicting change requests.

5. **Extract the most independent concept first.** Concepts with fewest dependencies are easiest to extract and validate. Early success builds confidence.

6. **Treat context boundaries as hypotheses.** First-attempt boundaries will likely be adjusted as understanding deepens. Expect to revise.

7. **Remove old code after all consumers are fully migrated.** Old code left in place becomes dead code. Delete the old model and facade code after complete migration.

8. **Use Strangler Fig pattern for model extraction.** Intercept specific features and route them to the new implementation. Each feature is independently migrated, verified, and the old path removed.

9. **Coordinate schema changes during split.** Plan database schema migration carefully. Old and new tables may coexist, requiring dual-write strategies.

## Validation Checklist
- [ ] Split is incremental, not big-bang
- [ ] Split guided by concrete pain (not theory)
- [ ] Old and new coexist during migration
- [ ] Consumers migrated one by one
- [ ] Old code removed after full migration
- [ ] Most independent concept extracted first
- [ ] Boundaries treated as hypotheses, adjusted as needed
- [ ] Strangler Fig pattern used for feature extraction

## Common Failures
- **Big-bang split.** Trying to split in one effort — application broken for weeks.
- **Splitting without concrete pain.** Splitting because "it's right" — cost not justified.
- **Old code not removed.** Split and abandon — dead code accumulates.

## Decision Points
- **Incremental extraction vs big-bang?** Always incremental. Never big-bang.

## Performance Considerations
- No runtime cost during normal operation. During split, old and new structures coexist (double storage, dual-write overhead).

## Security Considerations
- Security boundaries should be re-evaluated when splitting contexts.

## Related Rules
- Rule: Split incrementally, never via big-bang rewrite (DBC-08/05-rules.md)
- Rule: Use parallel implementation (DBC-08/05-rules.md)
- Rule: Split based on concrete pain, not theoretical purity (DBC-08/05-rules.md)
- Rule: Keep the old model as a facade during migration (DBC-08/05-rules.md)
- Rule: Extract the most independent concept first (DBC-08/05-rules.md)
- Rule: Treat context boundaries as hypotheses (DBC-08/05-rules.md)
- Rule: Remove old code after all consumers are fully migrated (DBC-08/05-rules.md)
- Rule: Use Strangler Fig pattern for model extraction (DBC-08/05-rules.md)
- Rule: Coordinate schema changes during split (DBC-08/05-rules.md)

## Related Skills
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)
- Extract Modules Incrementally (MMD-11/06-skills.md)
- Refactor and Remediate Architecture (AEG-09/06-skills.md)

## Success Criteria
- Monolithic model is split one concept at a time, each deployment independently verifiable.
- Old model operates as a facade during migration; consumers migrate one by one.
- Splitting decisions are justified by concrete pain metrics, not theoretical purity.
- Old code and facade are removed after all consumers migrate.
- Schema migration plan includes dual-write or migration path strategies.
