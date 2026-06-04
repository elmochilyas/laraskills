# Decomposition: Module Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Module Organization
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Standard Subdirectory Conventions
- **Topics:** Consistent subdirectories per feature (Controllers, Models, Services, Requests)
- **Key Content:** Enforcing a standard skeleton across all features, exceptions for simple features
- **Learning Objectives:** Define and enforce a consistent internal structure across all feature modules

### Chunk 2: Framework Convention Alignment
- **Topics:** Where framework-conventional paths go (e.g., `routes/` vs feature-local), Laravel expectations
- **Key Content:** Balancing framework conventions (route loading, view discovery) with feature locality
- **Learning Objectives:** Configure feature modules to work with Laravel's framework conventions

### Chunk 3: Shared Code Placement
- **Topics:** Where shared models, trait, helpers live outside features
- **Key Content:** `app/Models/` for shared models, `app/Concerns/` for shared traits, `app/Helpers/` for utilities
- **Learning Objectives:** Distinguish feature-specific code (inside feature) from shared code (outside feature)

### Chunk 4: Module Boundaries and Dependency Rules
- **Topics:** Feature-to-feature imports, shared kernel usage, dependency direction
- **Key Content:** Rules for when features can import from other features, shared kernel as intermediary
- **Learning Objectives:** Enforce module boundary rules to prevent circular dependencies between features
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization