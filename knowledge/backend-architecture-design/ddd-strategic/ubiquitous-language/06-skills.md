# Skill: Establish and Enforce Ubiquitous Language

## Purpose

Create a shared, consistent language between domain experts and developers that is reflected in code, documentation, and discussions.

## When To Use

- Starting a DDD project
- Resolving terminology confusion between business and development teams
- Onboarding new team members into domain concepts
- Reviewing code where business terms are inconsistently used

## When NOT To Use

- Trivial domains with universally understood terminology
- When domain experts are unavailable
- When the team is too small to benefit from formal language management

## Prerequisites

- Access to domain experts
- Shared glossary tool or documentation space
- Team commitment to language consistency

## Inputs

- Domain expert vocabulary
- Business process terminology
- Existing codebase terminology (for alignment)

## Workflow

1. Collect domain terms from domain experts during Event Storming or interviews
2. Define each term precisely, with a single meaning and usage context
3. Create a shared glossary accessible to all team members
4. Use the same terms in code: classes, methods, variables, events
5. Enforce language consistency in code reviews
6. Revise the glossary when terms evolve (new understanding)
7. Call out violations: when code uses a term differently than the glossary
8. Keep the glossary in the repository alongside the code

## Validation Checklist

- [ ] Glossary exists and is accessible to the whole team
- [ ] Code class/method names match glossary terms
- [ ] Domain experts recognize the terminology in code
- [ ] Each term has exactly one meaning (no ambiguity)
- [ ] Terms that differ from common English are documented
- [ ] Documentation uses the same language as code
- [ ] Language evolution is tracked (changes documented)
- [ ] Code review checks for language consistency

## Common Failures

- Glossary created but not referenced (becomes stale)
- Code using different terms than domain experts use
- Same term used for different concepts in different contexts
- Technical terms (Repository, Factory, DTO) mixed with domain terms
- Language not updated when domain understanding evolves

## Decision Points

- Accept borrowed technical term or create domain-specific term?
- English vs localized language for the codebase?
- How formal does the glossary definition need to be?

## Performance Considerations

- The glossary should be lightweight (~50-100 terms for most domains)
- Terms in code should be self-explanatory with the glossary as reference
- Avoid over-defining terms that are universally understood

## Security Considerations

- Sensitive domain terms should not reveal security vulnerabilities
- Security-related domain terms should be consistently enforced

## Related Rules (from 05-rules.md)

- Rule 4 (Event Storming): Keep events in the past tense (OrderPlaced, InvoicePaid)
- Rule 1 (Anemic vs Rich): Never allow domain entities to be property bags with zero behavior

## Related Skills

- Facilitate an Event Storming Workshop
- Identify Bounded Contexts
- Design a Rich Domain Model

## Success Criteria

- Domain experts can read the code and understand the business logic
- New team members learn the domain through the glossary and code together
- No ambiguity when discussing business concepts across the team
