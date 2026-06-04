# Skill: Implement Event Versioning and Schema Evolution

## Purpose

Manage changes to event schemas over time without breaking existing consumers or losing historical event data.

## When To Use

- Event-sourced systems where events persist indefinitely
- Integration events consumed by external systems
- Long-lived systems with evolving domain models
- When backward compatibility of event schemas is required

## When NOT To Use

- Events with short TTL (consumed and discarded quickly)
- Internal-only events within a single deployable unit
- When all consumers can be updated atomically

## Prerequisites

- Event schema definitions
- Consumer analysis (who consumes each event version)
- Schema evolution strategy (additive changes, versioned types)

## Inputs

- Current event schemas
- Proposed schema changes
- Consumer compatibility requirements

## Workflow

1. Add a `event_version` field to every event schema
2. Prefer additive changes (new fields with defaults) over breaking changes
3. For breaking changes, create a new event version (e.g., OrderPlacedV2 extends OrderPlaced)
4. Keep old event handlers active until all consumers migrate
5. Implement upcasters/transformers to upgrade old events on read
6. Document all schema changes in an event evolution log
7. Run contract tests to verify backward compatibility
8. Deprecate and remove old versions only when all consumers have migrated

## Validation Checklist

- [ ] All events have a version field
- [ ] Additive changes preferred over breaking changes
- [ ] Breaking changes create new event versions
- [ ] Old and new handlers coexist during migration
- [ ] Upcasters/transformers handle old event versions
- [ ] Event evolution log maintained
- [ ] Backward compatibility verified with contract tests
- [ ] Old versions removed only after consumer migration confirmed

## Common Failures

- No version field on events (can't identify schema)
- Breaking changes without new version (broken consumers)
- Removing old handlers before consumers migrate
- Not upcasting old events (fails on historical replay)
- Undocumented schema changes

## Decision Points

- Additive change vs new event version for this change?
- Migration window length before deprecating old version?
- Upcaster at read time vs migration at write time?

## Performance Considerations

- Upcasting on every read adds latency (consider caching)
- Multiple active versions increase code complexity
- Schema evolution log adds minimal storage overhead

## Security Considerations

- Event version history may reveal sensitive business changes
- Ensure upcasters don't introduce security vulnerabilities
- Old event handlers maintained for legacy data may have security gaps

## Related Rules (from 05-rules.md)

- Rule 5 (Contract Testing): Version contracts explicitly and support coexisting versions
- Rule 3 (Contract Testing): Provider tests must verify every consumer expectation

## Related Skills

- Distinguish Between Domain and Integration Events
- Implement Event Bus Patterns
- Design Event Sourcing Components

## Success Criteria

- Schema changes never break existing consumers
- Historical events can be replayed after schema evolution
- Event schema evolution history is documented and traceable
