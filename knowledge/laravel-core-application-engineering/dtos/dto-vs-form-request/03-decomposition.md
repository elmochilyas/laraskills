# Decomposition: DTO vs Form Request

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO vs Form Request
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Distinct Responsibilities
- **Topics:** FormRequest validates/authorizes HTTP input, DTO carries typed data between layers
- **Key Content:** The fundamental boundary: HTTP concerns vs internal data flow, why they overlap conceptually
- **Learning Objectives:** Articulate the distinct responsibilities of FormRequest and DTO

### Chunk 2: Duplication Anti-pattern
- **Topics:** Validating the same fields in both FormRequest and DTO, maintenance burden
- **Key Content:** Recognizing duplication, strategies to eliminate it (single validation source), validation passthrough
- **Learning Objectives:** Identify and eliminate validation duplication between FormRequests and DTOs

### Chunk 3: Conflation Anti-pattern
- **Topics:** DTO that depends on HTTP concerns, FormRequest acting as a service input
- **Key Content:** Signs of conflation (Request dependency in DTO, validation logic in DTO), refactoring approaches
- **Learning Objectives:** Detect and refactor conflated DTOs or FormRequests that cross responsibility boundaries

### Chunk 4: Clean Integration Patterns
- **Topics:** FormRequest validates → DTO constructed from validated data, service layer consumes DTO
- **Key Content:** The canonical flow: Request → Validation → DTO Construction → Service, handling authorization in FormRequest only
- **Learning Objectives:** Implement a clean integration where FormRequest and DTO complement each other without overlap or conflation
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization