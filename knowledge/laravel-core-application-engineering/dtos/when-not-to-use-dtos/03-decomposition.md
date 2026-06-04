# Decomposition: When NOT to Use DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** When NOT to Use DTOs
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Cost of a DTO
- **Topics:** File overhead, factory methods, serialization logic, consumer dependency
- **Key Content:** Quantifying the real cost: 30+ lines per DTO, maintenance surface area, cognitive overhead
- **Learning Objectives:** Calculate the concrete cost of introducing a DTO in terms of lines of code and maintenance burden

### Chunk 2: Simple Passthrough Scenarios
- **Topics:** Controller directly passes request data to service, no transformation needed
- **Key Content:** When an array or individual parameters suffice, the YAGNI principle applied to DTOs
- **Learning Objectives:** Identify scenarios where the data flow is simple enough that a DTO adds no value

### Chunk 3: Single-Use Internal Data
- **Topics:** Data used within one method or one class, no boundary crossing
- **Key Content:** The boundary rule: no layer crossing, no DTO needed; internal data structures vs formal DTOs
- **Learning Objectives:** Distinguish between internal data structures and formal DTOs and avoid the latter when not crossing boundaries

### Chunk 4: Framework-Native Alternatives
- **Topics:** When Eloquent models, FormRequests, or API Resources already serve the purpose
- **Key Content:** Framework-provided data carriers that eliminate the need for custom DTOs, overlapping responsibilities
- **Learning Objectives:** Leverage existing framework data carriers (models, requests, resources) instead of introducing DTOs in scenarios where they already cover the need
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization