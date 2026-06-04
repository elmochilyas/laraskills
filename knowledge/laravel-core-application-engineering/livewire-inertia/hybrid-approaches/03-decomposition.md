# Decomposition: Hybrid Approaches

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Hybrid Approaches
- **Difficulty Level:** Advanced

## Atomic Chunks

### Chunk 1: Use Cases for Hybrid
- **Topics:** Admin panel (Livewire) + public site (Inertia), different sections for different needs
- **Key Content:** CRUD-heavy admin vs complex public UI, team specialization, gradual migration scenarios
- **Learning Objectives:** Identify scenarios where running both Livewire and Inertia in the same application is beneficial

### Chunk 2: Route-Level Separation
- **Topics:** Each stack under its own route prefix, independent operation
- **Key Content:** `/admin/*` for Livewire, `/app/*` for Inertia, middleware selection, never mixing on one page
- **Learning Objectives:** Implement route-level separation so each stack operates independently

### Chunk 3: Shared Infrastructure
- **Topics:** Shared auth, shared models, shared services, separate frontend concerns
- **Key Content:** Laravel backend remains shared, splitting only the frontend rendering layer
- **Learning Objectives:** Design shared backend infrastructure that serves both frontend stacks

### Chunk 4: Operational Considerations
- **Topics:** Build tooling for both stacks, CI complexity, team skills, bundle size
- **Key Content:** `package.json` dependencies, CI pipeline for both stacks, developer onboarding overhead
- **Learning Objectives:** Evaluate and mitigate the operational overhead of maintaining two frontend stacks
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization