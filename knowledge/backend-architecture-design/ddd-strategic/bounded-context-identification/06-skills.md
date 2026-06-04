# Skill: Identify Bounded Contexts

## Purpose

Discover and define bounded contexts through domain analysis to establish clear module boundaries with minimal coupling.

## When To Use

- During greenfield project architecture design
- When decomposing a monolith into modules or services
- Resolving team ownership boundaries
- Before applying patterns like CQRS or event sourcing

## When NOT To Use

- Trivial domains with a single clear context
- When the system is too small to benefit from multiple contexts
- During rapid prototyping

## Prerequisites

- Domain knowledge or access to domain experts
- Understanding of DDD strategic patterns
- Event Storming workshop experience

## Inputs

- Domain expert knowledge
- Business process documentation
- Existing codebase structure (for brownfield)

## Workflow

1. Conduct Event Storming workshops with domain experts
2. Identify domain events and commands across the full process
3. Look for event terminology shifts (same concept named differently across teams)
4. Look for actor responsibility changes (who does what changes)
5. Mark boundaries where event frequency or structure changes
6. Name each bounded context by the domain language it owns
7. Document context mapping relationships between contexts
8. Validate boundaries with domain experts

## Validation Checklist

- [ ] Domain experts participated in boundary identification
- [ ] Bounded contexts align with business subdomains
- [ ] Each context has a consistent ubiquitous language
- [ ] Context boundaries are where terminology or actor changes
- [ ] Context mapping relationships documented
- [ ] Each context can theoretically be assigned to a different team
- [ ] No context is too small (1 entity) or too large (entire domain)

## Common Failures

- Technical boundaries instead of domain boundaries
- Single giant context containing the entire domain
- Over-fragmentation (too many tiny contexts)
- Missing subtle boundaries where language shifts gradually

## Decision Points

- Is this language difference significant enough to warrant a separate context?
- Should we merge two very small contexts or keep them separate?
- What context mapping pattern fits each relationship?

## Performance Considerations

- More contexts increase communication overhead
- Fewer contexts increase coupling
- Aim for 3-10 contexts in a medium-size enterprise system

## Security Considerations

- Sensitive data contexts need strict isolation
- Context boundaries are natural places for security gates
- Cross-context communication must respect authorization

## Related Rules (from 05-rules.md)

- Rule 2 (Event Storming): Find bounded contexts where domain event frequency or actor changes
- Rule 5 (Event Storming): Convert Event Storming output directly to code models within one sprint

## Related Skills

- Facilitate an Event Storming Workshop
- Define Context Mapping Relationships
- Decompose by Business Capability

## Success Criteria

- Domain experts agree the bounded contexts reflect the business structure
- Each context has a clearly documented ubiquitous language
- Team assignments can follow context boundaries naturally
