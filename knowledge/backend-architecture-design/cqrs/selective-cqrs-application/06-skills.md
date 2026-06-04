# Skill: Apply CQRS Selectively per Bounded Context

## Purpose

Choose the appropriate CQRS depth per bounded context rather than applying it as a system-wide architecture.

## When To Use

- Multi-context applications with varying read/write characteristics
- When some contexts need eventual consistency while others need strong consistency
- Migrating existing systems to CQRS incrementally
- Balancing simplicity with performance across the system

## When NOT To Use

- Single-context applications (no bounded context variation)
- When all contexts have similar read/write symmetry
- Teams without clear bounded context boundaries

## Prerequisites

- Bounded context identification
- CQRS maturity levels understanding
- Context mapping relationships

## Inputs

- Bounded context map with read/write characteristics per context
- Query complexity analysis per context
- Performance metrics per context
- Team capacity for CQRS infrastructure

## Workflow

1. Map all bounded contexts and assess read/write symmetry per context
2. Classify each context: CRUD-suitable, read-heavy, write-heavy, complex reads
3. Default to simple CRUD for contexts with balanced read/write (User profiles, Preferences)
4. Apply CQS (method-level separation) as the baseline for most contexts
5. Upgrade to full CQRS (read models, projectors) only for read-heavy or complex-query contexts
6. Maintain mixed model: different CQRS levels coexist per context
7. Phase adoption: pilot one context first, prove value, expand
8. Document each context's CQRS level in an ADR

## Validation Checklist

- [ ] Each bounded context has a documented CQRS level decision
- [ ] CRUD-suitable contexts use simple models, not full CQRS
- [ ] CQS used as default before upgrading to full CQRS
- [ ] Read-heavy contexts have read models where justified
- [ ] No context forced into CQRS level that doesn't match its needs
- [ ] Pilot context validated before expanding to others
- [ ] Mixed levels coexist without confusion

## Common Failures

- System-wide CQRS Level 3 (massive overengineering for simple contexts)
- No CQRS anywhere (missing optimization opportunities)
- Mixed levels without clear boundaries (confusion about which level applies)
- Starting at Level 3 (unable to reduce complexity later)

## Decision Points

- Which context to pilot first? (highest read/write asymmetry, clearest value)
- What's the default CQRS level for the application?
- How to handle cross-context queries with different CQRS levels?

## Performance Considerations

- Simple CRUD is fastest to develop and maintain
- CQS adds negligible overhead
- Full CQRS adds projection infrastructure but improves read performance
- Balance development velocity with query performance needs

## Security Considerations

- Different CQRS levels may have different security models per context
- Ensure cross-context event communication respects access controls
- Read models may expose data that write model would not

## Related Rules (from 05-rules.md)

- Rule 1: Apply CQRS selectively per use case — not globally across the entire application
- Rule 2: Use CQS (same model, separated methods) as the default
- Rule 3: Draw bounded-context boundaries at natural CQRS inflection points
- Rule 4: Use the same database and same model for simple CRUD
- Rule 5: Phase CQRS adoption by starting with one bounded context and expanding

## Related Skills

- Identify Bounded Contexts
- Assess and Progress Through CQRS Maturity Levels
- Assess CQRS Overengineering Risk

## Success Criteria

- Each bounded context uses the minimum CQRS level for its needs
- No context uses full CQRS without documented read/write asymmetry justification
- Pilot context successfully validated before expanding CQRS usage
