# Decomposition: Nested DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Nested DTOs
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Single-Level Nesting
- **Topics:** DTO containing a single child DTO, inline vs referenced nesting
- **Key Content:** ProfileDto inside UserDto, construction order, null child handling
- **Learning Objectives:** Implement DTOs that contain single child DTOs with proper construction and serialization

### Chunk 2: Collection Nesting
- **Topics:** DTO containing arrays/collections of child DTOs, `LineItemDto[]` in `OrderDto`
- **Key Content:** Map/conver pattern for collection property, type enforcement, empty collection handling
- **Learning Objectives:** Implement DTOs containing typed collections of child DTOs with correct recursion

### Chunk 3: Recursive Construction
- **Topics:** Building the full DTO tree from source data, preventing circular references
- **Key Content:** Depth-first construction, circular reference detection, lazy child construction tradeoffs
- **Learning Objectives:** Implement recursive construction that builds the DTO tree from nested source data

### Chunk 4: Recursive Serialization
- **Topics:** Nested `toArray()`, depth control, circular reference protection
- **Key Content:** Tree serialization, max-depth limits, lazy serialization for large graphs
- **Learning Objectives:** Implement serialization that correctly recurses through the DTO tree with safety mechanisms
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization