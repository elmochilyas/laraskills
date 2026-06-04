# Skill: Introduce a Value Object with Constructor Invariants

## Purpose

Create a Value Object (VO) that encapsulates a domain concept with constructor validation and equality semantics, and integrate it into DTOs as a typed property — replacing primitive obsession with a typed domain concept.

## When To Use

- A value has format rules or invariants (email, money, phone number, date range)
- Equality semantics matter — two values are the same if their properties match
- Primitive obsession is causing bugs (passing `int $userId` where `OrderId` expected)
- A domain concept needs behavior methods (`add()`, `multiply()`, `format()`)
- DTO properties represent domain-rich values (email, money, order ID)

## When NOT To Use

- The value has no invariants — a wrapper without validation is just a named scalar with ceremony
- The value is used in bulk operations (1000+ per request) — consider scalars in DTOs, VOs at service boundary
- The value is a simple string/int/boolean with no format rules or behavior
- The class would be used as a DTO (transporting across layers) — use a DTO, not a VO

## Prerequisites

- PHP 8.1+ for readonly properties
- Clear understanding of the domain concept's invariants and format rules
- Decision on VO placement: inside DTO or constructed at service boundary

## Inputs

- Domain concept definition (e.g., "email must be valid format", "money must have amount and currency")
- Invariants: what makes a value valid or invalid
- Behavior methods required (add, subtract, format, equals)
- DTO where the VO will be used as a property type

## Workflow for Creating a VO

1. Create a `readonly class` with a single purpose (one domain concept per VO)
2. Define the constructor with typed promoted properties
3. Add invariant validation in the constructor body — throw `\InvalidArgumentException` on invalid input
4. Implement `equals(self $other): bool` method for value equality
5. Add domain behavior methods (e.g., `add()`, `multiply()`, `format()`, `domain()`)
6. If the VO wraps a single scalar, consider adding `__toString()` for convenient serialization
7. Write tests: valid construction, invalid construction (expects exception), equality, behavior methods

## Workflow for Integrating VO into DTO

1. Identify DTO properties that represent domain concepts with format rules
2. Replace the scalar type hint with the VO type hint (e.g., `string $email` → `Email $email`)
3. Update the DTO factory methods to construct VOs from source data (e.g., `email: new Email($data['email'])`)
4. Update `toArray()` to serialize VOs explicitly (e.g., `'email' => $this->email->value` or `'email' => (string)$this->email`)
5. Update DTO tests to provide valid VO input

## Validation Checklist

- [ ] VO validates invariants in the constructor and throws on invalid input
- [ ] VO implements `equals()` for value-based comparison
- [ ] VO has no setter methods (readonly enforced)
- [ ] VO has focused behavior related to the value it represents
- [ ] DTO does not have domain behavior methods
- [ ] DTO serializes VOs explicitly in `toArray()` — never returns raw VO objects
- [ ] DTO factory methods construct VOs from source data
- [ ] Tests cover valid construction, invalid rejection, equality, and behavior

## Common Failures

- **VO without invariants**: A wrapper that accepts any string. No safety gained. Only add a VO if you validate.
- **DTO with VO methods**: Adding `equals()`, `add()`, `merge()` to a DTO. DTOs transport data; VOs have behavior.
- **Comparing DTOs by value**: Implementing `equals()` on a DTO. Reference comparison is correct for DTOs.
- **Primitive obsession still present**: Some properties use VOs, others use scalars for the same domain concept. Be consistent per concept.
- **VO serialization leak**: Returning VO objects directly from `toArray()`. Convert to primitives explicitly.

## Decision Points

- **VO inside DTO vs scalar in DTO → VO in service**: VO inside DTO gives type safety at the transport layer. Scalar in DTO with VO at service boundary keeps DTOs simpler. Choose based on team preference for typing purity vs construction simplicity.
- **Single property VO vs multi-property VO**: `Email` wraps one string. `Money` wraps amount (int) and currency (string). Make the scope narrow and focused.
- **Domain Primitive vs full VO**: Domain Primitive wraps a single scalar with validation but minimal behavior. Full VO adds behavior methods. Choose based on actual usage patterns.

## Performance Considerations

- VO construction: ~0.005ms per simple VO (email with filter_var), ~0.002ms for money VO
- For 5-20 VOs per request: total overhead <0.1ms — negligible
- For bulk operations (1000+ items): consider scalars in DTOs, construct VOs at service boundary

## Security Considerations

- VOs prevent invalid data from entering the domain by throwing at construction — eliminates nil-check chains
- VO serialization may expose internal validation logic (credit card last-four format) — use DTOs with selected fields for external output
- Domain Primitives prevent type confusion: passing `UserId` where `OrderId` is expected is a compiler error

## Related Rules

- Rule 1: Use Value Objects for Domain Concepts with Invariants; Use DTOs for Layer Crossing
- Rule 2: Value Objects Must Enforce Invariants in the Constructor
- Rule 3: DTOs Must Not Have Domain Behavior Methods
- Rule 4: Use VOs Inside DTOs for Domain-Rich Properties
- Rule 5: Never Compare DTOs by Value
- Rule 6: Serialize VOs Explicitly in DTO Output Methods

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- Data Object Transformation: Implement and Test DTO Output Methods

## Success Criteria

- VO validates invariants in the constructor — invalid values cannot exist as the VO type
- VO has `equals()` method for value comparison
- DTOs have no domain behavior methods (no `equals()`, `add()`, `merge()`)
- DTOs serialize VOs to primitives in `toArray()`
- Tests cover valid construction, invalid rejection, equality, and behavior
- Primitive obsession is reduced — domain concepts use typed VOs instead of scalars
