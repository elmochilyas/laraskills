# Skill: Assess CQRS Overengineering Risk

## Purpose

Evaluate whether CQRS adoption risks adding unnecessary complexity and identify strategies to stay lean.

## When To Use

- Before adopting CQRS for a new project or bounded context
- When team proposes full CQRS as "standard architecture"
- Retrospective on existing CQRS implementation
- Reviewing bounded context boundaries for CQRS applicability

## When NOT To Use

- When CQRS is already proven to add value in the context
- Simple CRUD with no read/write asymmetry
- When team has strong prior experience and data justifying CQRS

## Prerequisites

- CQRS maturity levels understanding
- Knowledge of the bounded context's read/write characteristics
- Performance baseline metrics

## Inputs

- Read/write traffic ratio per bounded context
- Query complexity (single aggregate vs cross-aggregate)
- Team experience with eventual consistency
- Current performance bottlenecks

## Workflow

1. Assess read/write asymmetry for each bounded context
2. Determine if CQS alone (method-level separation) is sufficient
3. Check if queries require cross-aggregate data or complex reshaping
4. Evaluate whether eventual consistency is acceptable for the use case
5. Review if team has experience with projection infrastructure
6. Start with CQS at method level; add full CQRS infrastructure only when CQS proves insufficient
7. Keep write and read models in the same repository until separation is proven necessary
8. Validate CQRS adoption with a 6-month retrospective

## Validation Checklist

- [ ] Read/write asymmetry measured before CQRS adoption
- [ ] CQS tried first (same model, separated methods)
- [ ] Read models introduced only for cross-aggregate queries
- [ ] Separate databases only if performance data justifies it
- [ ] Projections use simple interfaces, not coupled to specific event stores
- [ ] 6-month retrospective scheduled to validate adoption
- [ ] CQRS applied selectively, not as system-wide architecture

## Common Failures

- CQRS adopted as "standard architecture" without domain-specific justification
- Full event sourcing for simple CRUD applications
- Separate read/write databases for low-traffic systems
- Infrastructure-first thinking (spending weeks on buses before a single use case)
- No retrospective to validate whether CQRS is worth the complexity

## Decision Points

- Does this bounded context have genuine read/write asymmetry?
- Is eventual consistency acceptable for this use case?
- Can CQS (method-level separation) solve the problem with less infrastructure?

## Performance Considerations

- CQS adds zero infrastructure overhead
- Level 2 (read models) adds projection latency
- Level 3 (separate DB) adds operational complexity
- Level 4 (event sourcing) adds significant storage and compute costs

## Security Considerations

- Overengineering can create more surface area for vulnerabilities
- Event-sourced systems store all data forever — GDPR compliance may require purge capabilities
- Separate read models may need independent access controls

## Related Rules (from 05-rules.md)

- Rule 1: Apply CQRS only where justified by query complexity or throughput requirements
- Rule 2: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- Rule 3: Keep write and read models in the same repository until separation is proven necessary
- Rule 4: Abstract projections behind simple interfaces
- Rule 5: Validate CQRS adoption with a 6-month retrospective

## Related Skills

- Assess and Progress Through CQRS Maturity Levels
- Apply CQRS Selectively per Bounded Context
- Avoid Premature Abstraction YAGNI Violations

## Success Criteria

- CQRS infrastructure is proportional to actual read/write asymmetry
- No bounded context uses CQRS without documented justification
- 6-month retrospective confirms CQRS value or triggers simplification
