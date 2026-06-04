# Decomposition: form request validation

## Topic Overview

Form Request classes encapsulate validation logic, authorization, and error handling per request type. They implement `authorize()` (permission check) and `rules()` (validation rules array). Using `$request->validated()` returns only the data that passed validation — never use `$request->all()` to populate models or queries. The combination of Form Request validation + model `$fillable` provides defense in depth against mass assignment. Rule objects (`Rule::unique()`, `Password::default()`,...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
form-request-validation/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### form request validation
- **Purpose:** Form Request classes encapsulate validation logic, authorization, and error handling per request type. They implement `authorize()` (permission check) and `rules()` (validation rules array). Using `$request->validated()` returns only the data that passed validation — never use `$request->all()` to populate models or queries. The combination of Form Request validation + model `$fillable` provides defense in depth against mass assignment. Rule objects (`Rule::unique()`, `Password::default()`,...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: HTTP request lifecycle, Eloquent model $fillable/$guarded, Related: Mass assignment protection (complementary defense), Password validation rule objects, Advanced Follow-up: Custom validation rule objects (ValidationRule interface), Form Request testing patterns, and Complex conditional validation with nested arrays

## Dependency Graph
**Depends on:** Prerequisites: HTTP request lifecycle, Eloquent model $fillable/$guarded, Related: Mass assignment protection (complementary defense), Password validation rule objects, Advanced Follow-up: Custom validation rule objects (ValidationRule interface), Form Request testing patterns, and Complex conditional validation with nested arrays
**Depended on by:** Knowledge units that leverage or extend form request validation patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for form request validation.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization