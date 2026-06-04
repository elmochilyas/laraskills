# Decomposition: Resource vs DTO Decision

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource vs DTO Decision
- **Difficulty Level:** Expert

## Atomic Chunks

### Chunk 1: Core Purpose Distinction
- **Topics:** Resource as HTTP-aware output transformer, DTO as HTTP-agnostic data carrier
- **Key Content:** When data crosses the HTTP boundary (Resource) vs internal layers (DTO), conceptual overlap and confusion
- **Learning Objectives:** Distinguish the fundamental purpose of API Resources and DTOs

### Chunk 2: HTTP Awareness vs Layer Agnosticism
- **Topics:** Conditional loading (`whenLoaded`), URL generation, response envelope vs pure data
- **Key Content:** Resources know about HTTP context (request, relations), DTOs do not
- **Learning Objectives:** Identify which HTTP-aware features make a Resource unsuitable as a service-layer input/output

### Chunk 3: Dual-Use Anti-patterns
- **Topics:** Using a Resource as a DTO, using a DTO as a Resource, duplication or conflation
- **Key Content:** Common mistakes — embedding HTTP logic in DTOs, using Resources for internal data transfer
- **Learning Objectives:** Detect and refactor cases where Resources and DTOs are used interchangeably

### Chunk 4: Decision Framework for New Code
- **Topics:** Mapping table: which layer gets which type, when to use both, when to use only one
- **Key Content:** Decision tree based on whether data crosses HTTP boundary, needs transformation, or needs type safety
- **Learning Objectives:** Apply a systematic decision framework to choose Resources, DTOs, or both for a given endpoint or service
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization