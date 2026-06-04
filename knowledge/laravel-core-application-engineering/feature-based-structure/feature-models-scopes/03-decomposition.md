# Decomposition: Feature Models and Scopes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Models and Scopes
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Feature-Local Models
- **Topics:** Models that belong to a single feature, co-located in feature directory
- **Key Content:** `app/Features/Billing/Models/Invoice.php`, feature scope, no cross-feature access
- **Learning Objectives:** Place feature-specific models inside the feature directory and enforce access boundaries

### Chunk 2: Shared Models in app/Models/
- **Topics:** Models used across multiple features (User, Setting), top-level placement
- **Key Content:** `app/Models/User.php`, shared model contracts, minimizing shared model complexity
- **Learning Objectives:** Distinguish feature-specific from shared models and place them accordingly

### Chunk 3: Feature-Specific Scopes and Relationships
- **Topics:** Scopes that apply only within the feature context, relationship method placement
- **Key Content:** Scopes on shared models used only by one feature, eager loading conventions
- **Learning Objectives:** Define and organize Eloquent scopes and relationships that are specific to a feature

### Chunk 4: Model Contract and Interface Strategy
- **Topics:** Repository interfaces, model contracts, feature-to-model coupling reduction
- **Key Content:** Defining interfaces for models to decouple features, contract enforcement
- **Learning Objectives:** Use interfaces/contracts to reduce direct coupling between features and shared models
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization