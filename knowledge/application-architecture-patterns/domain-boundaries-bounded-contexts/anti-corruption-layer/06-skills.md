# Skill: Build Anti-Corruption Layer for Legacy Integration

## Purpose
Build an Anti-Corruption Layer (ACL) to protect your bounded context's domain model when integrating with legacy or external systems. Use Translator, Facade, and Adapter sub-patterns. Keep ACL within the consuming context. Translate conceptually, not just syntactically.

## When To Use
- Integrating with a legacy system that has a different domain model
- Integrating with an external system whose model would contaminate your bounded context

## When NOT To Use
- External system's model aligns closely with your context's model
- Integration is simple enough that direct translation in a service method suffices

## Prerequisites
- Bounded context identified with its own domain model
- Understanding of the legacy/external system's model

## Inputs
- Legacy system API or schema documentation
- Domain model of consuming context
- Identified translation rules

## Workflow
1. **Build ACL when model divergence exists, not for every integration.** If the external model closely matches your context's model, direct integration is simpler. ACL is for protecting model integrity from foreign schemas.

2. **Own the ACL in the consuming context.** Place the ACL within the consuming context's boundary, not in the upstream system. The consuming context is responsible for protecting its own model integrity.

3. **Translate conceptually, not just syntactically.** True translation converts foreign concepts (status codes, money formats) into your context's native concepts. A thin pass-through that renames fields doesn't protect your domain.

4. **Structure ACL with Translator, Facade, and Adapter sub-patterns.** The Translator handles two-way conversion, Facade simplifies the external system's complex interface, and Adapter implements the port interface defined by the consuming context.

5. **Do not expose legacy system details through the ACL.** Hide all legacy table names, API endpoints, and data formats behind the ACL interface. The consuming context must not know about legacy implementation.

6. **Provide bidirectional translation when writing back.** Implement both inbound (`toDomain()`) and outbound (`toLegacy()`) translation when the consuming context writes data to the external system.

7. **Test ACL translation logic in isolation.** Unit test the Translator with mock data to verify conversion rules (status mapping, currency conversion, date formatting).

8. **Update ACL when the external system changes.** Treat ACL changes as part of integration maintenance. An outdated ACL that silently produces incorrect translations corrupts data.

9. **Never let legacy models be imported directly.** Enforce that no legacy system class, Eloquent model, or DTO is imported directly in the consuming context's domain layer.

## Validation Checklist
- [ ] ACL protects context model integrity
- [ ] Translation is conceptual (not just field mapping)
- [ ] ACL lives in consuming context's boundary
- [ ] Legacy models never imported directly into context
- [ ] ACL is updated when legacy system changes
- [ ] Translator + Facade + Adapter sub-patterns used
- [ ] Bidirectional translation if writes to external system
- [ ] ACL translation logic has isolated unit tests

## Common Failures
- **No ACL when one is needed.** Directly using legacy models in the current context — legacy changes break the context.
- **ACL too thin.** Pass-through that translates field names but not concepts — domain model reflects legacy thinking.
- **Leaky ACL.** Some legacy methods exposed directly without translation — incomplete protection.

## Decision Points
- **Full ACL vs simple service method?** Full ACL when model divergence exists. Simple service method when the external model is closely aligned.

## Performance Considerations
- Translation adds processing overhead per call (microseconds). If performance-critical, consider caching translated results.

## Security Considerations
- ACL provides security isolation by translating only necessary data. No direct database access.
- All legacy interaction goes through the ACL, enforcing a single controlled path.

## Related Rules
- Rule: Always use ACL when integrating with different domain model (DBC-04/05-rules.md)
- Rule: Own the anti-corruption layer in the consuming context (DBC-04/05-rules.md)
- Rule: Translate conceptually, not just syntactically (DBC-04/05-rules.md)
- Rule: Structure ACL with Translator, Facade, and Adapter (DBC-04/05-rules.md)
- Rule: Do not expose legacy system details through the ACL (DBC-04/05-rules.md)
- Rule: Provide bidirectional translation (DBC-04/05-rules.md)
- Rule: Test ACL translation logic in isolation (DBC-04/05-rules.md)
- Rule: Update ACL when the external system changes (DBC-04/05-rules.md)
- Rule: Never let legacy models be imported directly (DBC-04/05-rules.md)

## Related Skills
- Map Context Relationships (DBC-02/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Apply Adapter Pattern (CPC-07/06-skills.md)
- Apply Dependency Rule (LAP-04/06-skills.md)

## Success Criteria
- ACL exists between consuming context and legacy/external system where model divergence exists.
- Translation covers both directions (inbound read and outbound write) where applicable.
- Legacy classes are never imported outside the ACL's boundary.
- ACL translation logic is unit tested in isolation, covering all status/currency/date conversion rules.
