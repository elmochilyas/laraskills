# Skill: Avoid Facade Pattern Risks at Context Boundaries

## Purpose
Never use single context-level facades (god facades). Use multiple small capability-based interfaces instead. Cap facades at 5-7 methods covering a single concern. Never expose internal types through facades. Allow direct use of capability interfaces. Reserve facades for third-party library wrappers.

## When To Use
- Wrapping external third-party libraries (Stripe, Twilio, Mailchimp)
- Genuinely complex subsystems where consumer needs a simplified interface

## When NOT To Use
- Cross-context boundaries (use multiple small capability interfaces instead)
- When the facade would grow beyond 5-7 methods

## Prerequisites
- Bridge/adapter pattern (CPC-07)
- Interface contracts (CPC-01)

## Inputs
- Context capability map
- Third-party library API surfaces

## Workflow
1. **Never use context-level facades.** Never define a single facade (e.g., `BillingFacade`) that exposes all capabilities of a bounded context. Use multiple small capability-based interfaces instead.

2. **Cap small facades at 5-7 methods.** If a facade is necessary, limit it to 5-7 methods covering a single concern. Split any facade that exceeds this threshold into smaller interfaces.

3. **Never expose internal types through the facade.** Facades must never return internal value objects, enums, or entities. Convert all return types to shared or public DTOs.

4. **Do not make the facade the only entry point.** Allow consumers to use capability interfaces directly without going through a facade. A facade is a convenience, not a requirement.

5. **Use facades for third-party integration only.** Reserve the facade pattern for wrapping external third-party libraries. Prefer capability-based interfaces for internal context boundaries.

## Validation Checklist
- [ ] No single "god facade" per context (e.g., `BillingFacade` with 20+ methods)
- [ ] Capability-based interfaces used instead of context facades
- [ ] Facades (if used) are limited to 5-7 methods
- [ ] Facades don't expose internal types
- [ ] Third-party integrations use facades for isolation
- [ ] Consumers can use capability interfaces directly (facade not mandatory)

## Common Failures
- **God facade.** A facade with dozens of unrelated methods — bottleneck and coupling point.
- **Facade exposes internal types.** Consumers coupled to internal enums/objects — changes break consumers.
- **Facade as the only entry point.** Developers forced through bloated facade even for simple operations.

## Decision Points
- **Context facade vs capability interfaces?** Always prefer capability interfaces for internal boundaries. Use facades only for third-party library isolation.
- **Split facade threshold?** 5-7 methods. If a facade exceeds this, decompose into focused interfaces.

## Performance Considerations
- Facade adds one extra delegation layer (microseconds). Negligible.

## Security Considerations
- A god facade may inadvertently expose operations that shouldn't be accessible cross-context. Smaller interfaces restrict access per capability.

## Related Rules
- Rule: Never use context-level facades (CPC-12/05-rules.md)
- Rule: Cap small facades at 5-7 methods (CPC-12/05-rules.md)
- Rule: Never expose internal types through the facade (CPC-12/05-rules.md)
- Rule: Do not make the facade the only entry point (CPC-12/05-rules.md)
- Rule: Use facades for third-party integration only (CPC-12/05-rules.md)

## Related Skills
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Anti-Corruption Layer (DBC-04/06-skills.md)
- Map Context Relationships (DBC-05/06-skills.md)

## Success Criteria
- No bounded context has a single monolithic facade covering all its capabilities.
- Every cross-context capability is accessed via a dedicated focused interface (2-5 methods).
- Any existing facades are limited to 5-7 methods covering a single concern.
- No facade returns internal types — all return values are shared DTOs.
- Consumers can inject capability interfaces directly without going through a facade.
- Facades are used only for wrapping third-party libraries — not for internal context boundaries.
