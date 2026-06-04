# Decomposition: Resource Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Testing
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Unit Testing Resource Output
- **Topics:** Testing `toArray()` output for given models, conditional field assertions
- **Key Content:** Asserting response shape, field values, relationship presence/absence, metadata keys
- **Learning Objectives:** Write unit tests that verify resource transformation output for different model states

### Chunk 2: Conditional and Dynamic Field Coverage
- **Topics:** Testing `when()`, `whenLoaded()`, `whenHas()`, `mergeWhen()` conditions
- **Key Content:** Covering every conditional branch, testing with and without loaded relations, edge cases for null values
- **Learning Objectives:** Verify conditional field rendering across all possible data states

### Chunk 3: Integration Testing via HTTP Endpoints
- **Topics:** Full request-to-response testing, status codes, response JSON structure
- **Key Content:** Combining controller tests with resource assertions, testing pagination metadata, testing error responses
- **Learning Objectives:** Write integration tests that assert the complete HTTP response including resource transformations

### Chunk 4: Collection and Pagination Testing
- **Topics:** `ResourceCollection` output, `PaginatedResourceResponse` metadata
- **Key Content:** Testing collection shape, pagination links, meta keys, empty collections, single-item collections
- **Learning Objectives:** Validate collection and paginated resource responses for correctness and completeness
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization