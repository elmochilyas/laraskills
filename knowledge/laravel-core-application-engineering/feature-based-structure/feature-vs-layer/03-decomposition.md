# Decomposition: Feature vs Layer

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature vs Layer
- **Difficulty Level:** Foundation

## Atomic Chunks

### Chunk 1: Layer-Based Organization Characteristics
- **Topics:** Technical grouping (all controllers together, all models together), Laravel defaults
- **Key Content:** `app/Http/Controllers/`, `app/Models/` layout, familiarity, framework alignment
- **Learning Objectives:** Describe layer-based organization and its alignment with Laravel defaults

### Chunk 2: Feature-Based Organization Characteristics
- **Topics:** Domain grouping (billing controllers + models + services together), domain cohesion
- **Key Content:** `app/Features/Billing/` layout, autonomy per feature, domain-driven design alignment
- **Learning Objectives:** Describe feature-based organization and its benefits for domain cohesion

### Chunk 3: Tradeoff Comparison
- **Topics:** Discoverability, navigation, cross-cutting concerns, code reuse
- **Key Content:** Layer pros (framework-aligned, easier cross-cutting), feature pros (self-contained, domain-focused)
- **Learning Objectives:** Compare the tradeoffs of each approach across multiple dimensions (navigation, reuse, team scaling)

### Chunk 4: Decision Framework
- **Topics:** When to use layer-based, feature-based, or hybrid
- **Key Content:** Project size, team size, domain complexity, team preference considerations
- **Learning Objectives:** Select the appropriate structural approach based on concrete project characteristics
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization