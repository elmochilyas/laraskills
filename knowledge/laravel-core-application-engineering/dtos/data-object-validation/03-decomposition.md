# Decomposition: Data Object Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Data Object Validation
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Validation on the DTO vs FormRequest
- **Topics:** Shifting validation boundary from HTTP layer to data contract layer
- **Key Content:** Advantages (validation for all entry points), tradeoffs (HTTP-specific rules), duplication risks
- **Learning Objectives:** Compare the DTO-validation approach with traditional FormRequest validation

### Chunk 2: Attribute-Based Validation Rules
- **Topics:** PHP 8 attributes for validation, custom rule attributes, reusable rule sets
- **Key Content:** Defining `#[Rule]` attributes on DTO properties, composing rule objects, parameterized rules
- **Learning Objectives:** Implement validation rules using PHP attributes directly on DTO properties

### Chunk 3: Manual Validation in Constructors/Factories
- **Topics:** Validating in `fromArray()` or `__construct()`, throwing on invalid data
- **Key Content:** Validation throw vs collect-and-return patterns, error message preservation
- **Learning Objectives:** Implement constructor-time validation that rejects invalid DTO construction

### Chunk 4: Multi-Entry Point Validation
- **Topics:** DTO used from HTTP, CLI, queue — validation works everywhere automatically
- **Key Content:** Code reuse across entry points, avoiding HTTP-specific rules on DTOs, layered validation (DTO + FormRequest)
- **Learning Objectives:** Structure DTO validation so it works identically across all application entry points
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization