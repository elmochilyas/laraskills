# Skill: Identify Bounded Contexts Using Language, Teams, and Data Signals

## Purpose
Identify bounded contexts using three signals (language divergence, team alignment, data lifecycle) through facilitated workshops. Start coarse and split later. Align each context to a dedicated namespace in the codebase. Validate with business stakeholders.

## When To Use
- Before defining module boundaries or microservice boundaries
- Any non-trivial application with domain complexity

## When NOT To Use
- CRUD-only applications with no meaningful domain complexity

## Prerequisites
- Access to business stakeholders for validation
- Understanding of DDD concepts

## Inputs
- Business noun glossary with multiple potential meanings
- Team structure and data lifecycle requirements

## Workflow
1. **Use language divergence as the primary signal.** If two parts of the business use "Order" differently, they should be separate contexts. Gather business nouns, list meanings per usage, group by meaning (not word).

2. **Start coarse, split later.** Default to broader contexts (3-5 for most applications). It's easier and safer to split a large context than to merge two that shouldn't have been separated.

3. **Validate context boundaries with business stakeholders.** Ask domain terminology questions: "Does 'Customer' mean the same thing here?" before coding.

4. **Use facilitated workshops.** Conduct Event Storming, Domain Storytelling, or Data Ownership Matrix workshops with both technical and business participants.

5. **Distinguish between owned and referenced models in each context.** Classify each concept as owned (context creates/updates/deletes) or referenced (context reads by ID from another context).

6. **Align context boundaries with module/namespace boundaries.** Map each bounded context to a dedicated module directory or namespace prefix.

7. **Avoid database-driven boundaries.** Identify contexts from business language, not from existing table structure. Do not create a context for every CRUD entity.

8. **Use data lifecycle divergence as a secondary signal.** Data that changes at different rates under different consistency needs should be in separate contexts.

## Validation Checklist
- [ ] Context boundaries identified using language, teams, data signals
- [ ] Boundaries validated with business stakeholders
- [ ] Not driven by database structure
- [ ] Coarse boundaries (can split later if needed)
- [ ] Context map documents relationships
- [ ] Owned vs referenced models classified per context
- [ ] Each context mapped to dedicated namespace in codebase

## Common Failures
- **Database-driven boundaries.** Using existing table structure to define contexts — boundaries don't align with business language.
- **Too many contexts.** 20 contexts for a small application — integration overhead dominates.
- **No validation with stakeholders.** Technical-only identification misses subtle semantic differences.

## Decision Points
- **Coarse vs fine boundaries?** Default to coarse (3-5 contexts). Fine boundaries only when clear language divergence exists at day one.

## Performance Considerations
- No runtime cost. Design-time only (workshops, mapping, documentation).

## Security Considerations
- Context boundaries should align with data access boundaries for security.

## Related Rules
- Rule: Identify contexts using language divergence, not database schema (DBC-01/05-rules.md)
- Rule: Default to coarse boundaries and split later (DBC-01/05-rules.md)
- Rule: Separate contexts when data has distinct lifecycle (DBC-01/05-rules.md)
- Rule: Validate context boundaries with business stakeholders (DBC-01/05-rules.md)
- Rule: Align context boundaries with module/namespace boundaries (DBC-01/05-rules.md)
- Rule: Use event storming or domain storytelling for context discovery (DBC-01/05-rules.md)
- Rule: Distinguish between owned and referenced models in each context (DBC-01/05-rules.md)

## Related Skills
- Map Context Relationships (DBC-02/06-skills.md)
- Design Shared Kernel (DBC-03/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)
- Identify Modular Monolith Boundaries (MMD-02/06-skills.md)

## Success Criteria
- Bounded contexts are identified using business language divergence as the primary signal.
- Context boundaries are validated with business stakeholders before implementation.
- Each context maps to a dedicated namespace in the codebase.
- Owned vs referenced models are explicitly classified per context.
- Boundaries are coarse (fewer than 5 for typical applications) with documented rationale.
