# Skill: Test DTOs Unit

## Purpose
Write isolated unit tests for Data Transfer Objects — testing construction from each input source, default values, type enforcement, serialization, immutability, and nested DTOs — using direct instantiation with zero mocking and zero database.

## When To Use
- Every DTO class in the application
- DTOs defining API request/response contracts
- DTOs used as input/output for action/service classes

## When NOT To Use
- Plain arrays passed between layers (no contract to test)
- Eloquent models used directly as data carriers (use model tests instead)
- Value Objects that are simple wrappers

## Prerequisites
- PHP 8 typed properties and promoted constructor
- DTO design patterns

## Inputs
- DTO class files with factory methods (fromArray, fromRequest, fromModel)
- Input data examples per construction path

## Workflow
1. Test construction from each input type: `PostDTO::fromArray([...])`, `PostDTO::fromModel($post)` — each factory method may have different mapping logic
2. Test default values: assert optional fields get expected defaults when not provided
3. Test type enforcement: pass wrong types and assert `TypeError` for typed properties
4. Test serialization: `$dto->toArray()`, `$dto->toJson()`, `json_encode($dto)` — assert expected output structure
5. Test immutability: assert no public setters exist; verify DTO doesn't change after `toArray()`
6. Test nested DTOs: test construction and serialization recursively for DTOs containing other DTOs
7. Use PestPHP datasets to test multiple input combinations without performance impact

## Validation Checklist
- [ ] Construction tested from each input type
- [ ] Default values for optional fields verified
- [ ] Type enforcement tested (wrong types throw `TypeError`)
- [ ] Serialization (`toArray`, `toJson`) matches expected structure
- [ ] Immutability verified (no setters, no modification after construction)
- [ ] Nested DTOs tested recursively
- [ ] Zero mocking used — all tests use direct instantiation

## Common Failures
- Not testing serialization — DTO constructs correctly but `toArray()` returns wrong keys
- Making DTOs mutable — setters allow accidental modification after construction
- Testing DTOs through feature tests (HTTP → controller → DTO) instead of direct instantiation
- Omitting optional fields from construction tests — nullable field that defaults wrong goes undetected

## Decision Points
- Input source coverage: which factory methods need independent tests
- Serialization format: toArray vs toJson vs json_encode — test all if used
- Nested DTO depth: test direct children only vs recursive depth

## Performance Considerations
- DTO unit tests are essentially free — no dependencies, no database, no framework
- Run on every file save — DTO test suite for 50 DTOs completes in <100ms
- No special CI configuration needed

## Security Considerations
- DTOs carrying data from untrusted sources should have validation integrated
- Immutability prevents accidental data corruption after construction
- Serialization tests ensure no unexpected data leaks via `toArray()`
- Ensure `fromRequest()` doesn't map hidden/guarded fields from user input

## Related Rules
- Test Construction From Each Input Type
- Test Default Values For Optional Fields
- Test Type Enforcement
- Test Serialization
- Test Immutability
- Test Nested DTOs Recursively

## Related Skills
- Isolate Test Layers
- Test Action/Service Unit
- Test Response Shape

## Success Criteria
- Every DTO has unit tests for all input sources
- Default values verified for all optional fields
- Type enforcement proven (wrong types throw TypeError)
- Serialization output matches expected structure exactly
- Immutability guaranteed — no setters, no post-construction modification
- Nested DTOs serialize correctly at all levels
- Tests require zero mocking, zero database, zero framework boot
