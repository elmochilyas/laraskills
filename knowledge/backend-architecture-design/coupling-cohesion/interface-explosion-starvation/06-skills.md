# Skill: Balance Interface Granularity

## Purpose

Avoid both interface explosion (too many fine-grained interfaces) and interface starvation (too few interfaces causing tight coupling).

## When To Use

- When deciding whether to extract an interface for a class
- Code review showing excessive interface proliferation
- Codebase where mocking requires interface for everything
- Adopting hexagonal architecture (ports need interfaces)

## When NOT To Use

- Value objects and DTOs (never need interfaces)
- Single-implementation internal services with no variation point
- Closure/callable can replace a single-method interface

## Prerequisites

- Interface Segregation Principle
- Understanding of role interfaces vs header interfaces

## Inputs

- Current interface count and usage patterns
- Module boundary definitions
- Testing strategy (mocking needs)

## Workflow

1. Create interfaces only when at least two implementations exist or are confirmed
2. For single-method contracts, prefer callable/Closure over an interface
3. Merge small interfaces from the same context into role interfaces
4. Provide default implementations for interfaces with many methods
5. Never create interfaces for value objects or DTOs
6. Keep interfaces at architectural boundaries (hexagonal ports) even with one implementation
7. Remove interfaces that no longer have multiple implementations

## Validation Checklist

- [ ] All interfaces have at least two implementations (or are hexagonal ports)
- [ ] No interface exists for value objects or DTOs
- [ ] Single-method contracts use callable where possible
- [ ] Classes implementing 5+ interfaces from same context are merged
- [ ] Default/base implementations exist for multi-method interfaces
- [ ] No interface uses "I" prefix (PHP convention)
- [ ] One-interface-one-implementation cases have justification
- [ ] Dead interfaces (single impl, no planned second) are removed

## Common Failures

- Interface for every service class (navigation nightmare)
- No interfaces for external dependencies (impossible to mock)
- Interface defined after implementation (mirrors concrete exactly)
- "I" prefix conventions from Java in PHP
- One interface, one implementation, never swapped (wasted abstraction)

## Decision Points

- Is this a hexagonal port (needs interface) or internal service (may not)?
- Can a callable replace this single-method interface?
- Should small interfaces merge into a role interface?

## Performance Considerations

- Interface calls add negligible overhead in PHP
- Constructor injection of many small interfaces may increase initialization time
- Merge interfaces when construction becomes verbose

## Security Considerations

- Security-related interfaces (AuthenticationProvider, AuthorizationGate) should be explicit, not callables
- Never merge security interfaces with non-security interfaces

## Related Rules (from 05-rules.md)

- Rule 1: Create interfaces only when there are or will be at least two implementations
- Rule 2: When you have too many small interfaces, consider merging them
- Rule 3: Replace interfaces with callables/closures for single-method contracts
- Rule 4: Provide a default implementation so consumers don't have to implement every interface
- Rule 5: Don't create interfaces for value objects or DTOs

## Related Skills

- Detect Premature Abstraction YAGNI Violations
- Design Hexagonal Architecture Ports and Adapters
- Apply Interface Segregation Principle

## Success Criteria

- Every interface in the codebase has at least two implementations (or is a hexagonal port)
- Team can navigate interfaces without feeling lost in abstraction
- No interface exists without a concrete, current need
