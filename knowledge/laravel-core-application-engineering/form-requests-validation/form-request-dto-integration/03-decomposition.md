# Decomposition: Form Request DTO Integration

## Topic Overview
Bridging validation to DTOs — converting validated FormRequest data into typed DTOs via toDto() methods or static factory methods before passing to services or actions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
form-request-dto-integration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Form Request DTO Integration
- **Purpose:** toDto method, bridging validation to DTOs
- **Difficulty:** Advanced
- **Dependencies:** Form Request Fundamentals, DTO Construction

## Dependency Graph
This KU depends on: Form Request Fundamentals, DTO Construction. It connects the HTTP validation layer to the service/domain layer.

## Boundary Analysis
**In scope:** Bridge pattern (FormRequest → toDto() → DTO), validated() as DTO source, safe() for scoped validation, fromRequest() static factory on DTO, payload() convenience method, constructor-based construction with named arguments, toDto() vs fromRequest() decision, DTO vs direct validated() in controller.
**Out of scope:** DTO construction patterns (covered in DTOs subdomain), Form Request pipeline (covered in Form Request Fundamentals), service layer consumption of DTOs (covered in Service Layer).

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