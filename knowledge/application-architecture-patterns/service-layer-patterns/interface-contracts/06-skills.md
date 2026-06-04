# Skill: Design Interface Contracts for Services at Variation Points

## Purpose
Create interface contracts for services only at variation points — places where multiple implementations are needed (payment gateways, notification channels, storage adapters). Avoid interface-per-class syndrome. Keep interfaces focused (Interface Segregation Principle) and bind implementations in service providers.

## When To Use
- Multiple implementations likely (payment gateways, notification channels, file storage)
- Service consumed across module boundaries
- Following Clean Architecture port-adapter pattern

## When NOT To Use
- Single implementation with no planned alternative
- Service consumed only within same layer
- Interface-per-class syndrome (interface for every service)

## Prerequisites
- Understanding of the YAGNI principle
- Knowledge of service provider binding

## Inputs
- Service classes at variation points
- Interface-to-implementation mapping

## Workflow
1. **Add interfaces only at variation points.** If only one implementation exists and no alternative is planned, skip the interface. Add when the second implementation is actually needed (YAGNI).

2. **Avoid interfaces that mirror implementation exactly.** Same methods and signatures provide no abstraction. Design the interface at a different abstraction level (e.g., `PaymentGateway::charge(Money $amount, PaymentSource $source)` instead of `StripeGateway::chargeStripe()`).

3. **Be consistent as a team.** Either use interfaces for all infrastructure services or none. Inconsistency is worse than either choice. Document the rule.

4. **Watch for interface pollution.** Keep interfaces focused (Interface Segregation Principle). An interface with 20+ methods covering every possible use case becomes a god interface. Split by client need.

5. **Avoid interface-per-class syndrome.** Do not create an interface for every class in the codebase. Use interfaces only at architectural boundaries or real variation points.

6. **Bind interface to implementation in a Service Provider.** Centralize bindings in one place. Do not use `app()->bind()` inline in controllers or other classes.

7. **Use contextual binding when different consumers need different implementations.** Use the service provider's `when()` method to specify which implementation each consumer receives.

## Validation Checklist
- [ ] Interfaces exist only at variation points
- [ ] No interface-per-class syndrome
- [ ] Interface provides abstraction beyond mirroring implementation
- [ ] Interface-to-implementation bindings are registered in service provider
- [ ] No interface pollution (20+ methods covering every use case)
- [ ] Team convention is documented and consistent

## Common Failures
- **Interface-per-class without reason.** Every service has an interface including single-implementation services — ceremony without value.
- **Interface mirrors implementation exactly.** Methods and signatures identical — adds no abstraction.
- **Interface pollution.** Single interface with 20+ methods — violates Interface Segregation Principle.

## Decision Points
- **Interface vs no interface?** Add at variation points only (payment, storage, notification). Skip for single-implementation business services (UserService, OrderService).

## Performance Considerations
- Interface dispatch has negligible overhead. PHP 8+ JIT eliminates virtual call cost.

## Security Considerations
- No direct implications. Interfaces are structural, not security-related.

## Related Rules
- Rule: Add Interfaces Only At Variation Points (SLP-13/05-rules.md)
- Rule: Avoid Interfaces That Mirror Implementation Exactly (SLP-13/05-rules.md)
- Rule: Be Consistent As A Team (SLP-13/05-rules.md)
- Rule: Watch For Interface Pollution (SLP-13/05-rules.md)
- Rule: Avoid Interface-Per-Class Syndrome (SLP-13/05-rules.md)
- Rule: Bind Interface To Implementation In Service Provider (SLP-13/05-rules.md)

## Related Skills
- Inject Service Dependencies (SLP-09/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Design Feature-Oriented Repositories (SLP-15/06-skills.md)
- Apply Dependency Rule (LAP-04/06-skills.md)

## Success Criteria
- Interfaces exist only at real variation points — not for single-implementation business services.
- Each interface provides meaningful abstraction beyond mirroring implementation methods.
- Bindings are centralized in service providers, not scattered inline.
- No interface has 20+ methods (segregated by client need).
