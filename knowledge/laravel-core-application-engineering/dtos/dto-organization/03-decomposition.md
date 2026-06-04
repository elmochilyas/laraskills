# Decomposition: DTO Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Organization
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Per-Domain Placement
- **Topics:** DTOs inside feature directories (`app/Features/Billing/DTOs/`), domain cohesion
- **Key Content:** Keeping DTOs close to their domain logic, avoiding cross-domain imports, discoverability tradeoffs
- **Learning Objectives:** Organize DTOs by domain/feature directory for maximum domain cohesion

### Chunk 2: Per-Operation Grouping
- **Topics:** DTOs co-located with specific actions/services, action-level DTOs
- **Key Content:** DTOs named after operations (`ProcessPaymentData`, `RefundOrderData`), action locality
- **Learning Objectives:** Structure DTOs by operation to improve action-level locality and reduce cognitive overhead

### Chunk 3: Centralized app/DTOs/ Directory
- **Topics:** Flat `app/DTOs/` layout, namespacing by domain within directory
- **Key Content:** Discoverability benefits, namespace vs directory mapping, collision risks in large codebases
- **Learning Objectives:** Implement a centralized DTO directory strategy and manage naming collisions through subnamespaces

### Chunk 4: Organization Decision Framework
- **Topics:** Tradeoff analysis of all three strategies, team-scale considerations
- **Key Content:** Mapping project characteristics (team size, feature count, DTO count) to optimal organization strategy
- **Learning Objectives:** Evaluate and select the appropriate DTO organization strategy based on project scale and team structure
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization