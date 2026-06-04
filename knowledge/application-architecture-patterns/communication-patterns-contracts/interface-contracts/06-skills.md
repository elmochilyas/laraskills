# Skill: Define Formalized Contracts Between Bounded Contexts

## Purpose
Define versioned, immutable contracts (interface + readonly DTOs) at every bounded context boundary. Use semantic versioning. Contract-test both producer and consumer. Keep contracts lean. Place contracts in a shared location accessible to both sides.

## When To Use
- Every pair of communicating contexts needs a contract
- Cross-context synchronous communication

## When NOT To Use
- Within a single context (interfaces are internal)
- Trivial one-way communication (use events)

## Prerequisites
- Bounded contexts identified and mapped
- Understanding of semver

## Inputs
- Data shapes crossing context boundaries
- Operations exposed to other contexts

## Workflow
1. **Define contracts at every context boundary.** Every communicating pair of bounded contexts needs a formal contract (interface + DTO). Without a contract, changes in one break the other.

2. **Use DTOs instead of Eloquent models in contracts.** Never pass Eloquent models across context boundaries. Use readonly DTOs that are independent of the persistence implementation.

3. **Version contracts on breaking changes.** When making backward-incompatible changes (removing fields, changing types), increment the version. Multiple versions coexist during migration.

4. **Use semantic versioning for contracts.** Major = breaking change, Minor = additive, Patch = bug fix. Consumers pin to a major version and upgrade independently.

5. **Contract-test both producer and consumer.** Write shared contract tests that both sides run. Producer verifies it satisfies the contract. Consumer verifies it can work with the contract.

6. **Keep DTOs immutable.** Use `readonly` classes with public constructor promotion. If the consumer can modify the DTO, it creates hidden coupling.

7. **Keep contracts lean.** Limit DTOs to the minimum fields the consumer actually needs. Every field is a dependency.

8. **Place contracts in a shared location.** Define contracts in a shared directory accessible to both producer and consumer. Do not place them inside either context's private code.

## Validation Checklist
- [ ] Cross-context communication has defined contracts
- [ ] Contracts use DTOs (not Eloquent models)
- [ ] Contracts are versioned
- [ ] Both producer and consumer test against contracts
- [ ] No backward-incompatible changes without version increment
- [ ] DTOs are immutable (readonly)
- [ ] Contracts are lean (minimum fields needed)
- [ ] Contracts placed in shared location

## Common Failures
- **No contract.** Communicating contexts without a defined contract — changes in one break the other.
- **Contract = implementation.** Defining contract in terms of producer's internals (Eloquent models) — contract reflects implementation details.
- **Backward-incompatible changes without versioning.** Adding required field to DTO consumers don't fill — breaks consumers.

## Decision Points
- **Interface contract vs Event?** Interface contracts for synchronous request-response. Events for asynchronous one-way communication.

## Performance Considerations
- In-process contract calls: microseconds.
- Serialization/deserialization cost for DTOs at boundary crossings.

## Security Considerations
- Contracts define what data crosses boundaries. Only contract-defined data is shared.

## Related Rules
- Rule: Define contracts at every context boundary (CPC-01/05-rules.md)
- Rule: Use DTOs instead of Eloquent models in contracts (CPC-01/05-rules.md)
- Rule: Version contracts on breaking changes (CPC-01/05-rules.md)
- Rule: Use semantic versioning for contracts (CPC-01/05-rules.md)
- Rule: Contract-test both producer and consumer (CPC-01/05-rules.md)
- Rule: Keep DTOs immutable (CPC-01/05-rules.md)
- Rule: Keep contracts lean (CPC-01/05-rules.md)
- Rule: Place contracts in a shared location (CPC-01/05-rules.md)

## Related Skills
- Map Context Relationships (DBC-02/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement Open Host Service (DBC-02/06-skills.md)

## Success Criteria
- Every cross-context communication has a formal contract (interface + readonly DTO).
- No Eloquent model is used in a cross-context contract.
- Contracts use semantic versioning; breaking changes create new versions.
- Both producer and consumer run shared contract tests against the same contract definition.
- Contracts are lean, immutable, and placed in a shared location accessible to both sides.
