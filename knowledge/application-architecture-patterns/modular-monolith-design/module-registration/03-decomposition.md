# Decomposition: Module registration and discovery mechanisms

## Topic Overview

Modules must be registered with the application so that routes, migrations, config, and service providers are discovered. The two primary mechanisms are explicit registration (manually adding each module's service provider to `config/app.php`) and automatic discovery (convention-based scanning of a modules directory).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-04-module-registration/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Module registration and discovery mechanisms
- **Purpose:** Modules must be registered with the application so that routes, migrations, config, and service providers are discovered. The two primary mechanisms are explicit registration (manually adding each module's service provider to `config/app.php`) and automatic discovery (convention-based scanning of a modules directory).
- **Difficulty:** Intermediate
- **Dependencies:** MMD-03 Module internal structure

## Dependency Graph

This KU depends on: MMD-03 Module internal structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Explicit registration:** Each module's service provider is listed in `config/app.php`: ```php 'providers' => [
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization