# Decomposition: Versioned Resources

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Versioned Resources
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Version Directory Isolation
- **Topics:** `app/Http/Resources/V1/`, `app/Http/Resources/V2/` layout, namespace strategy
- **Key Content:** Keeping breaking changes isolated, full vs partial resource duplication between versions
- **Learning Objectives:** Organize resource classes by version directory to isolate breaking schema changes

### Chunk 2: Resource Inheritance Between Versions
- **Topics:** Extending V1 resources in V2, field overrides, base resource classes
- **Key Content:** Inheritance strategies to avoid duplication, `V2\UserResource extends V1\UserResource`, field addition/removal patterns
- **Learning Objectives:** Use resource inheritance to minimize duplication when evolving response schemas

### Chunk 3: Controller Version Selection
- **Topics:** How controllers select the correct resource class per version, dependency injection of versioned resources
- **Key Content:** Version resolver pattern, factory methods, route-based version detection
- **Learning Objectives:** Implement controller logic that dynamically selects the correct versioned resource class

### Chunk 4: Migration and Deprecation Strategy
- **Topics:** Sunsetting old resource versions, maintaining backward compatibility, deprecation headers
- **Key Content:** Communication with API consumers, version sunset timelines, `Deprecation`/`Sunset` headers
- **Learning Objectives:** Plan and execute a resource version migration with minimal consumer disruption
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization