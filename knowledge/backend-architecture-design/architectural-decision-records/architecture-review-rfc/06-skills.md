# Skill: Run an Architecture RFC Review Process

## Purpose

Formally propose, evaluate, and approve significant architectural changes before implementation begins.

## When To Use

- Introducing a new technology or framework
- Changing a core architectural pattern (e.g., monolith to microservices)
- Making a decision with cross-team impact
- Adopting a new infrastructure component (message broker, database, cache)

## When NOT To Use

- Trivial decisions (variable naming, library patch versions)
- Security hotfixes requiring immediate deployment
- Changes with no architectural impact (UI-only changes)

## Prerequisites

- Understanding of ADR formats (Nygard, MADR, Y-Statement)
- Centralized RFC repository

## Inputs

- Problem statement and context
- Proposed solution with tradeoffs
- At least two alternative approaches evaluated

## Workflow

1. Identify the architectural decision requiring review
2. Write an RFC with: context, options evaluated, tradeoffs, proposed decision
3. Submit RFC to the centralized repository
4. Set a review deadline (e.g., 5 business days)
5. Reviewers evaluate based on reasoning quality, not seniority
6. Address feedback and update the RFC
7. Accept, reject, or escalate by the deadline
8. Create an ADR documenting the final decision
9. Update C4 diagrams and fitness functions in the same PR

## Validation Checklist

- [ ] RFC written before implementation begins
- [ ] At least two alternatives evaluated with tradeoffs
- [ ] Review period has a clear deadline
- [ ] Decision based on evidence, not seniority
- [ ] RFC is searchable in a centralized location
- [ ] ADR created from the accepted RFC
- [ ] Lightweight option used for small decisions

## Common Failures

- RFC written after implementation (retroactive rationalization)
- No deadline causing indefinite stalls
- Decisions by title rather than argument quality
- No lightweight path causing process fatigue

## Decision Points

- Full RFC vs ADR-lite for this decision?
- Who needs to be in the review group?
- Which alternatives merit formal evaluation?

## Performance Considerations

- Keep RFCs to 1-2 pages for readability
- Set 30-minute review meetings max
- Aim for 3-5 business day turnaround

## Security Considerations

- Security-sensitive RFCs may need restricted access
- Compliance decisions may require regulatory review

## Related Rules (from 05-rules.md)

- Rule 1: Write the RFC before writing implementation code
- Rule 2: Decide by merit of argument, not seniority
- Rule 3: Provide a lightweight option for trivial decisions
- Rule 4: Make all RFCs searchable in a centralized location
- Rule 5: Conduct lightweight retrospectives on past decisions

## Related Skills

- Write an Architecture Decision Record
- Define Architecture Fitness Functions
- Model Architecture with C4 Diagrams

## Success Criteria

- All architectural decisions in the last quarter have corresponding RFCs
- Average RFC review cycle completes within 5 business days
- No repeated debates about previously decided topics
