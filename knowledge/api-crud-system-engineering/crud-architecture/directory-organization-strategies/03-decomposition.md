# Decomposition: Directory Organization Strategies

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Directory Organization Strategies
- **Difficulty Level:** Foundation

## Topic Overview
Strategies for organizing CRUD architecture layers into directories — layer-first (technical), domain-first (feature), mixed/hybrid, and migration between strategies.

## Decomposition Strategy
This KU covers the structural organization of all CRUD architecture files. It is the meta-KU that shows how all other KUs fit into the filesystem.

## Proposed Folder Structure
```
directory-organization-strategies/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Directory Organization Strategies
- **Purpose:** Define directory and namespace organization for CRUD layers
- **Difficulty:** Foundation
- **Dependencies:** All CRUD Architecture KUs

## Atomic Chunks

### Chunk 1: Layer-First Organization
- **Topics:** app/Controllers, app/Services, app/Actions, app/DTOs, app/Models
- **Key Content:** Technical organization, Laravel default, pros/cons
- **Learning Objectives:** Navigate a layer-first codebase

### Chunk 2: Domain-First Organization
- **Topics:** app/Domain/Users/, app/Domain/Orders/, domain isolation
- **Key Content:** Business capability organization, PSR-4 configuration
- **Learning Objectives:** Set up domain-first autoloading and structure

### Chunk 3: Mixed/Hybrid Strategies
- **Topics:** Layer-first with domain subdirectories, shared kernel, domain modules
- **Key Content:** Compromise approaches for different codebase sizes
- **Learning Objectives:** Design a hybrid structure for a growing codebase

### Chunk 4: Migration Between Strategies
- **Topics:** Layer-first → Domain-first migration steps, namespace updates, autoloading
- **Key Content:** Safe migration without breaking existing code
- **Learning Objectives:** Migrate from layer-first to domain-first

## Dependency Graph
Depends on: All CRUD Architecture KUs. This is the meta-KU that organizes all other KUs into a directory structure.

## Boundary Analysis
**In scope:** Directory structure strategies, namespace mapping, migration paths, PSR-4 configuration.
**Out of scope:** Specific patterns within each layer (covered in individual KUs), deployment file structure (covered in Deployment KUs), Docker/CI directory structure (separate topics).

## Future Expansion Opportunities
Module system (Laravel modules package integration) could be added if the codebase adopts modular architecture.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization