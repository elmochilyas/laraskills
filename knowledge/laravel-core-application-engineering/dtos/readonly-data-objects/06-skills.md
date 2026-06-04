# Skill: Apply Readonly Enforcement to a DTO

## Purpose

Convert an existing mutable DTO (or create a new one) with language-level readonly enforcement using PHP 8.2 `readonly class` or PHP 8.1 `public readonly` properties, and implement the "with" pattern for producing modified copies.

## When To Use

- Creating a new DTO — apply `readonly` from the first commit
- Refactoring an existing mutable "DTO" (parameter bag) to enforce immutability
- Adding immutability to a codebase currently using mutable data objects
- Implementing the "with" pattern to enable safe modification semantics

## When NOT To Use

- When lazy initialization is required (computed on first access) — readonly prevents deferred assignment
- When the class must extend a non-readonly class (PHP 8.2 restriction)
- When using spatie/laravel-data's `#[Lazy]` properties — lazy loading requires deferred assignment incompatible with `readonly class`
- For non-DTO classes (services, controllers, jobs)

## Prerequisites

- PHP 8.1+ (individual readonly properties) or PHP 8.2+ (readonly class)
- DTO class with constructor promotion ready for immutability
- PHPStan level 6+ configured to detect uninitialized readonly properties

## Inputs

- DTO class definition (existing or new)
- List of properties that need the "with" pattern for modified copies
- Serialization requirements (caching, queues) that may need `__serialize()`/`__unserialize()`

## Workflow

1. Add `readonly` keyword before `class` in the class declaration (`readonly class UserDto`)
2. Ensure all constructor parameters use constructor promotion — no manual property declarations
3. Remove any setters — they should error on readonly properties
4. Remove any `__set()` or `__get()` magic methods — PHP 8.2 readonly classes prohibit them
5. For each property that may need a modified copy, add a `with*()` method:
   - `public function withName(string $name): self { return new self($name, $this->email); }`
   - Returns a new instance with the specified property changed
6. Add a bulk `with()` method if the DTO has 10+ properties that need modification
7. If the DTO is used in serialization contexts (cache, queues), implement `__serialize()` and `__unserialize()` — use `toArray()`/`fromArray()` as the serialization mechanism
8. Remove any `clone` + mutation patterns — cloned readonly objects are still readonly
9. Run PHPStan level 6+ to verify all readonly properties are initialized in all construction paths
10. Remove any reflection-based assignment that bypasses readonly — use factories

## Validation Checklist

- [ ] Class declared as `readonly class` (PHP 8.2+) or `public readonly` on all promoted properties (PHP 8.1)
- [ ] All properties use constructor promotion — no manual declarations
- [ ] No setters or mutable methods exist
- [ ] No `__set()` or `__get()` magic methods
- [ ] "with" pattern methods exist for properties that need modified copies
- [ ] No `clone` + mutation patterns in the codebase
- [ ] `__serialize()`/`__unserialize()` implemented if used in cache/queue contexts
- [ ] PHPStan level 6+ passes — no uninitialized readonly properties
- [ ] No reflection-based readonly property assignment in production code

## Common Failures

- **Non-readonly by default**: Team forgets `readonly` keyword. Apply `readonly class` from the first commit.
- **Clone-and-mutate**: `$clone = clone $dto; $clone->name = 'Jane'` — still errors. Use `withName('Jane')` instead.
- **Uninitialized properties**: Factory method fails to assign all promoted readonly properties. PHPStan level 6+ catches these.
- **Spread construction**: `new UserDto(...$data)` with missing keys leaves properties uninitialized. Use explicit mapping.
- **Serialization bypass**: `unserialize()` creates DTOs without calling constructor. Implement `__serialize()`/`__unserialize()`.

## Decision Points

- **readonly class vs individual readonly properties**: Use `readonly class` for PHP 8.2+. Use `public readonly` on each property for PHP 8.1 compatibility or when extending non-readonly classes.
- **With-pattern scope**: Add `with*()` methods for commonly changed properties. For 10+ properties, consider a `with(array $changes)` method or evaluate if the DTO scope is too broad.
- **Serialization strategy**: For readonly DTOs in queues/caches, prefer `JsonSerializable` + manual deserialization via `fromArray()` rather than PHP serialize/unserialize.

## Performance Considerations

- Readonly properties add zero runtime overhead in PHP 8.1+ — single opcode access
- Readonly is faster than abstraction layers (getter methods) that hide mutability
- The "with" pattern allocates a new object on each call — negligible for 1-5 copies per request
- For bulk modifications (100+ copies), consider redesigning to avoid per-item modifications

## Security Considerations

- `unserialize()` bypasses the constructor and readonly assignment guarantee — control serialization via `__serialize()`/`__unserialize()` or prefer `JsonSerializable`
- Readonly classes cannot use `__set()` magic, preventing dynamic property injection
- Uninitialized readonly properties accessed accidentally cause `\Error` at runtime — prevents silent null propagation

## Related Rules

- Rule 1: Declare Every DTO as a `readonly class` (PHP 8.2+) or Use `public readonly` on All Properties (PHP 8.1)
- Rule 2: Always Use Constructor Promotion — Never Manually Assign Properties
- Rule 3: Use the "with" Pattern for Modified Copies Instead of Mutation
- Rule 4: Control Serialization via `__serialize()`/`__unserialize()` to Prevent Unserialize Bypass
- Rule 5: Never Add `__set` or `__get` Magic Methods to Readonly DTOs
- Rule 6: Run Static Analysis at PHPStan Level 6+ to Catch Uninitialized Readonly Properties

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO

## Success Criteria

- DTO is declared as `readonly class` (PHP 8.2+) or all properties are `public readonly` (PHP 8.1)
- All properties use constructor promotion
- "With" pattern methods exist for properties needing modified copies
- No `__set()` or `__get()` magic methods exist
- No clone-and-mutate patterns exist in the codebase
- PHPStan level 6+ passes without uninitialized property errors
- Serialization is controlled (either `__serialize()`/`__unserialize()` or `JsonSerializable`)
