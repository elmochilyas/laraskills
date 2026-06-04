# Decision Trees — DTO Unit Testing

## Tree 1: Construction Source Testing

**Decision Context**: Which DTO construction paths to test — fromArray, fromModel, fromRequest, from each named constructor.

**Decision Criteria**:
- Number of named constructors per DTO
- Input source differences
- Data transformation logic in constructors

**Decision Tree**:
```
Does the DTO have multiple named constructors (fromArray, fromModel, fromRequest)?
├── YES → Test each constructor independently — they may apply different transformations to the same fields
└── NO → Does the DTO use only a single constructor (new PostDTO(...))?
    ├── YES → Test construction with full input (all fields), partial input (defaults), and minimal input (required only)
    └── NO → Test all available construction paths
```

**Rationale**: Each named constructor may apply different transformations (fromModel may snake_case keys, fromRequest may camelCase). Testing one constructor does not validate others.

**Recommended Default**: Test every named constructor with full, partial, and minimal input sets.

**Risks**: Testing only one construction path misses transformation bugs in other paths.

---

## Tree 2: Serialization and Immutability Testing

**Decision Context**: Whether to test serialization (toArray, toJson) and immutability separately from construction.

**Decision Criteria**:
- Serialization format differences (array vs JSON vs response)
- PHP readonly class usage
- API contract strictness

**Decision Tree**:
```
Does the DTO implement custom toArray() or toJson() logic?
├── YES → Test serialization explicitly: constructor -> toArray -> verify keys and values match expected format
└── NO → Does the DTO use PHP 8.2 readonly properties?
    ├── YES → Test readonly enforcement: expect(fn() => $dto->property = 'x')->toThrow(Error::class)
    └── NO → Test immutability differently: after toArray(), verify original DTO properties unchanged
```

**Rationale**: Custom serialization logic is a common source of bugs (wrong keys, missing fields, extra fields). Readonly properties enforce immutability at language level; non-readonly DTOs need explicit immutability tests.

**Recommended Default**: Test `toArray()` output matches expected keys and values. Test readonly enforcement or immutability.

**Risks**: Untested serialization lets contract-breaking key changes reach consumers.
