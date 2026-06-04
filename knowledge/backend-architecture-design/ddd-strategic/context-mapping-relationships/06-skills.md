# Skill: Define Context Mapping Relationships

## Purpose

Document how bounded contexts relate to each other, choosing the appropriate cooperation or partnership pattern.

## When To Use

- After bounded contexts are identified
- When teams need to agree on integration points
- Before implementing cross-context communication
- During architectural reviews of module boundaries

## When NOT To Use

- Single-context systems (no mapping needed)
- When contexts have no interaction

## Prerequisites

- Identified bounded contexts
- Understanding of context mapping patterns (Partnership, Shared Kernel, Customer-Supplier, Conformist, Anti-Corruption Layer, Open-Host Service, Published Language, Separate Ways)

## Inputs

- Bounded context map
- Cross-context communication requirements
- Team ownership structure
- Organizational culture (high collaboration vs arms-length)

## Workflow

1. List all pairwise context relationships
2. For each pair, determine the cooperation level (high -> low)
3. Choose appropriate pattern based on team relationships and technical needs
4. Document the chosen pattern and rationale
5. For each downstream context, decide if an ACL is needed
6. For upstream contexts, consider OHS/Published Language
7. Implement the mapped communication channel
8. Revisit mappings when organization or architecture changes

## Validation Checklist

- [ ] Every pair of interacting contexts has a documented mapping
- [ ] Cooperation level reflects actual team relationship
- [ ] Downstream contexts have ACLs where languages diverge
- [ ] Upstream contexts use OHS for multi-consumer APIs
- [ ] Partnership pattern used for equal, collaborative teams
- [ ] Shared Kernel minimized to stable, commonly-used concepts
- [ ] Separate Ways used when interaction isn't worth the coupling
- [ ] Mapping reviewed when team structure changes

## Common Failures

- Defaulting to Partnership when teams lack collaborative culture
- Using ACL everywhere (unnecessary translation overhead)
- No mapping for implicit relationships (hidden coupling)
- Not updating mappings when team structure changes
- Shared Kernel bloated with concepts that should be context-specific

## Decision Points

- Partnership vs Customer-Supplier based on organizational power?
- ACL vs Conformist based on translation cost vs modification cost?
- Separate Ways vs any integration this pair?

## Performance Considerations

- ACL adds translation overhead per call
- Shared Kernel adds synchronization cost
- OHS adds API maintenance overhead
- Separate Ways avoids all integration costs

## Security Considerations

- Context boundaries are security perimeters
- ACLs can sanitize data crossing boundaries
- OHS APIs must authenticate cross-context consumers
- Shared Kernel should not contain sensitive data

## Related Rules (from 05-rules.md)

- Rule 5 (ACL): Apply ACL selectively only at genuinely incompatible context boundaries
- Rule 1 (Hexagonal): Domain layer must have zero imports from infrastructure or framework

## Related Skills

- Identify Bounded Contexts
- Implement an Anti-Corruption Layer
- Facilitate an Event Storming Workshop

## Success Criteria

- All cross-context relationships have explicit, documented mapping patterns
- Context maps are understood by all relevant teams
- Communication between contexts follows the chosen pattern consistently
