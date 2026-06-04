# Decomposition: DTOs vs Resources Pattern for Data Transformation

## Topic Overview
Data Transfer Objects (DTOs) and API Resources (`JsonResource`) serve complementary purposes in Laravel API integrations. DTOs are lightweight, immutable objects that carry typed data between the API consumption layer and application logic, ensuring type safety and clear contracts. API Resources transform application models/collections into JSON responses for outgoing APIs. The choice between them depends on data flow direction: DTOs for incoming data (API responses â†’ application), Resources for outgoing data (application â†’ API responses). SaloonPHP's DTO plugin bridges the gap by auto-casting API responses to typed DTOs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k016-dto-vs-resources/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### DTOs vs Resources Pattern for Data Transformation
- **Purpose:** Data Transfer Objects (DTOs) and API Resources (`JsonResource`) serve complementary purposes in Laravel API integrations. DTOs are lightweight, immutable objects that carry typed data between the API consumption layer and application logic, ensuring type safety and clear contracts. API Resources transform application models/collections into JSON responses for outgoing APIs. The choice between them depends on data flow direction: DTOs for incoming data (API responses â†’ application), Resources for outgoing data (application â†’ API responses). SaloonPHP's DTO plugin bridges the gap by auto-casting API responses to typed DTOs.
- **Difficulty:** Intermediate
- **Dependencies:** K004, K010, K026, K009

## Dependency Graph
**Depends on:**
- K004
- K010
- K026
- K009

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- DTO (Data Transfer Object)
- API Resources (JsonResource)
- Data Mapping
- Type Safety
- Immutability
- Serialization

**Out of scope:**
- K004 topics covered in their respective KUs
- K010 topics covered in their respective KUs
- K026 topics covered in their respective KUs
- K009 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization