# Skill: Write an Architecture Decision Record

## Purpose

Capture architectural decisions with context, alternatives, rationale, and consequences for team traceability and onboarding.

## When To Use

- Making a significant technology or pattern choice
- Changing or reversing a previous architectural decision
- Onboarding new team members who need decision context
- Documenting why a seemingly suboptimal choice was made

## When NOT To Use

- Trivial decisions with no lasting impact
- Decisions already fully documented in code (method names, variable choices)
- Temporary experiments with an expiration date

## Prerequisites

- Familiarity with at least one ADR format (Nygard, MADR, Y-Statement)

## Inputs

- Decision context and problem description
- Options considered with pros/cons
- Final decision and rationale

## Workflow

1. Recognize a decision that needs documentation
2. Choose the appropriate format (full ADR vs ADR-lite)
3. Write the ADR before or during implementation (never after)
4. Include: title, status, context, options, decision, consequences
5. Store in `docs/adr/` in the same repository as the code
6. Mark superseded ADRs with status and link to replacement
7. Set a review deadline for open ADRs
8. Review and accept within the deadline window

## Validation Checklist

- [ ] ADR written before code merge (not retroactive)
- [ ] Context explains why the decision was needed
- [ ] At least two alternatives evaluated
- [ ] Decision rationale is clear
- [ ] Consequences (positive and negative) documented
- [ ] Stored in code repository, not external wiki
- [ ] Superseded ADRs are properly marked and linked
- [ ] ADR covers decisions with significant lasting impact only

## Common Failures

- Post-hoc ADRs that rationalize instead of document
- No supersession management (old and new ADRs both active)
- ADR fatigue from documenting trivial choices
- ADRs stored in external systems invisible during development
- Open ADRs stalling indefinitely without deadlines

## Decision Points

- Full Nygard/MADR vs Y-Statement ADR-lite?
- Does this supersede an existing ADR?
- Review window length?

## Performance Considerations

- Full ADR: ~30 minutes to write, ~15 minutes to review
- ADR-lite: ~5 minutes to write, ~2 minutes to review
- Target 5-10 new ADRs per quarter for a medium-size team

## Security Considerations

- Security-sensitive decisions may need restricted ADR visibility
- Compliance requirements may mandate full MADR format

## Related Rules (from 05-rules.md)

- Rule 1: Write an ADR before or during implementation
- Rule 2: Clearly supersede old ADRs when a decision changes
- Rule 3: Reserve ADRs for decisions with significant lasting impact
- Rule 4: Store ADRs in the same repository as the code they govern
- Rule 5: Enforce a mandatory review period and deadline

## Related Skills

- Run an Architecture RFC Review Process
- Implement Architecture Fitness Functions
- Model Architecture with C4 Diagrams

## Success Criteria

- Every significant architectural decision has a corresponding ADR
- Team can answer "why was this chosen?" for any past decision
- ADR supersession chain is navigable and up to date
