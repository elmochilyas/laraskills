# Skill: Map Context Relationships Between Bounded Contexts

## Purpose
Document relationship types between every pair of interacting bounded contexts. Choose the right relationship (Partnership, Shared Kernel, Customer-Supplier, Conformist, ACL, Open Host Service, Separate Ways) based on coupling needs. Keep the context map alive and documented as code.

## When To Use
- After bounded contexts are identified
- During architectural planning to determine integration patterns

## When NOT To Use
- Single-context applications (no relationships to map)

## Prerequisites
- Bounded contexts identified (DBC-01)
- Understanding of DDD context mapping relationship types

## Inputs
- List of bounded contexts
- Integration requirements between contexts

## Workflow
1. **Document all cross-context relationships in a context map.** Record the relationship type between every pair of interacting contexts. Store as code or diagram in the repository.

2. **Prefer Open Host Service for stable upstream APIs.** When a context provides data to multiple downstream consumers, publish a clear contract (interface + DTOs). This decouples upstream implementation from downstream consumers.

3. **Use Anti-Corruption Layer for integrating with divergent models.** When integrating with a context whose domain model significantly differs from yours, use ACL (translation) to protect your model's integrity.

4. **Avoid defaulting to Shared Kernel.** Default to Separate Ways or Open Host Service. Use Shared Kernel only when the shared code is stable, minimal, and used by three or more contexts.

5. **Default to Separate Ways when contexts implement the same concept differently.** Each context should model the concept in its own language — don't force a shared model.

6. **Use Customer-Supplier when upstream must accommodate downstream.** Document explicit agreements about provided fields and prohibited dependencies.

7. **Use Partnership only for coordinated, interdependent changes.** Reserve this for genuinely co-evolving contexts that require simultaneous changes by separate teams.

8. **Use Conformist only when downstream accepts upstream model without translation.** This creates maximum coupling — use only when the cost of translation exceeds the coupling cost.

9. **Keep the context map alive.** Update it whenever cross-context relationship types change. Tie updates to architectural reviews.

## Validation Checklist
- [ ] Context map documents all cross-context relationships
- [ ] Relationship type is intentional (not default)
- [ ] Integration patterns match the relationship type
- [ ] Shared Kernel is minimal where used
- [ ] Context map is kept up-to-date
- [ ] Rationale for each relationship type is documented

## Common Failures
- **No context map.** Contexts exist but relationships are undocumented — inconsistent integration patterns.
- **Defaulting to Shared Kernel.** Sharing too much code across contexts — hidden coupling.
- **Defaulting to Separate Ways.** Two contexts implementing same concept differently with no coordination — business logic duplication.

## Decision Points
- **ACL vs Conformist?** ACL when upstream model diverges from yours. Conformist only when upstream model is a perfect fit and changes infrequently.
- **OHS vs Customer-Supplier?** OHS for stable published APIs with multiple consumers. Customer-Supplier when upstream must explicitly accommodate downstream requirements.

## Performance Considerations
- No runtime cost. Design-time documentation only.

## Security Considerations
- Context relationships may expose data across boundaries. ACL provides security isolation through translation.

## Related Rules
- Rule: Document all cross-context relationships in a context map (DBC-02/05-rules.md)
- Rule: Prefer Open Host Service for stable upstream APIs (DBC-02/05-rules.md)
- Rule: Use Anti-Corruption Layer for integrating with divergent models (DBC-02/05-rules.md)
- Rule: Avoid defaulting to Shared Kernel relationship (DBC-02/05-rules.md)
- Rule: Default to Separate Ways when contexts implement same concept differently (DBC-02/05-rules.md)
- Rule: Use Customer-Supplier when upstream must accommodate downstream (DBC-02/05-rules.md)
- Rule: Keep the context map alive (DBC-02/05-rules.md)

## Related Skills
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Design Shared Kernel (DBC-03/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)

## Success Criteria
- Context map exists as documented code or diagram with all cross-context relationships recorded.
- Each relationship type is intentional with documented rationale.
- Shared Kernel is minimal (<20 classes) and not the default relationship type.
- Context map is kept up-to-date as part of architectural reviews.
