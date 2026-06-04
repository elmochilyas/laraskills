# Skill: Manage Synchronous Inter-Module Communication via Contracts

## Purpose
Define contract interfaces in the providing module's Contracts/ directory so consumers can call methods synchronously without importing implementation classes or coupling to internal module structure.

## When To Use
- Module A needs a synchronous response from Module B before proceeding
- Operations that must complete before response is returned to client
- Type-safe, traceable communication required

## When NOT To Use
- Module A only needs to notify Module B without response (use events)
- Modules should not be coupled at all (use events)
- Modules should actually be merged (boundary is wrong)

## Prerequisites
- Module internal structure with Contracts/ directory
- Laravel service container for binding
- Understanding of interfaces and dependency injection

## Inputs
- Identified synchronous communication needs between modules
- Response data structure (DTOs)
- Providing module's implementation

## Workflow
1. **Define the contract interface in the providing module's Contracts/ directory.** The provider owns the interface and controls its evolution. Name after the service capability (`InvoiceContract`).

2. **Use DTOs, not Eloquent models, in contract method signatures.** Create readonly DTO classes for method parameters and return types. This decouples the consumer from the provider's database schema.

3. **Implement the contract in the providing module's Services/ or internal directory.** Create a concrete class implementing the contract interface. Keep the implementation class in internal namespaces (not Contracts/).

4. **Bind the contract to implementation in the providing module's service provider.** Use `$this->app->bind(InvoiceContract::class, InvoiceService::class)`. This makes the contract resolvable by the container.

5. **Inject the contract interface in the consumer's constructor.** The consumer type-hints the contract interface, not the concrete implementation. Laravel's container resolves the bound implementation automatically.

6. **Test the contract implementation against the contract interface.** Write contract tests that verify the implementation satisfies the interface contract. Use these tests against every implementation.

7. **Version contracts when breaking changes are needed.** Create `InvoiceContractV2` for breaking changes. Maintain both versions during a transition period. Consumers migrate independently.

## Validation Checklist
- [ ] Contract interface in providing module's Contracts/ directory
- [ ] DTOs used in method signatures (not Eloquent models)
- [ ] Implementation class not in Contracts/ directory
- [ ] Contract bound to implementation in service provider
- [ ] Consumer injects contract interface (not implementation)
- [ ] No circular contract dependencies exist
- [ ] Contract tests verify implementation matches interface

## Common Failures
- **Implementation in contract namespace.** Placing implementation class in Contracts/. Keep Contracts/ for interfaces only.
- **Domain entities in contracts.** Methods accepting/returning Eloquent models. Use DTOs instead.
- **Circular contract dependency.** Module A's contract depends on B's, which depends on A's. Extract shared contracts or merge modules.

## Decision Points
- **Contract in providing vs consuming module?** Always in providing module — the provider controls the API.
- **Version on change or skip versioning?** Version when the monolith evolves incrementally. In synchronized deployments, skip versioning with documented decision.

## Performance Considerations
- Synchronous contract calls: microseconds (PHP method calls) — fastest inter-module mechanism.

## Security Considerations
- Contracts do not provide security isolation — authorization still applies.
- Contract methods should validate caller identity if needed for security boundaries.

## Related Rules
- Rule: Use Contracts for Sync Communication (MMD-06/05-rules.md)
- Rule: Use DTOs in Contract Signatures (MMD-06/05-rules.md)
- Rule: Contracts in Providing Module (MMD-06/05-rules.md)
- Rule: Bind Contracts in Service Provider (MMD-06/05-rules.md)
- Rule: Version Contracts for Breaking Changes (MMD-06/05-rules.md)
- Rule: Test Contract Implementations (MMD-06/05-rules.md)
- Rule: Avoid Circular Contract Dependencies (MMD-06/05-rules.md)

## Related Skills
- Manage Async Inter-Module Communication via Events (MMD-07/06-skills.md)
- Implement Data Transfer Objects (LAP-14/06-skills.md)
- Bind Interfaces to Implementations (LAP-09/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)

## Success Criteria
- All synchronous cross-module communication goes through contract interfaces.
- Contract interviews use DTOs, not Eloquent models.
- No circular contract dependencies exist.
- Contract tests verify behavioral and type alignment between interface and implementation.
