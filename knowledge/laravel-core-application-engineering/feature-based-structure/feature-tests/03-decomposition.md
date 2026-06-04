# Decomposition: Feature Tests

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Tests
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Test Directory Mirrors Feature Structure
- **Topics:** `tests/Features/Billing/` mirroring `app/Features/Billing/`
- **Key Content:** One-to-one mapping, co-located test files, test namespace conventions
- **Learning Objectives:** Organize tests in a structure that mirrors the feature-based source layout

### Chunk 2: Feature Test Naming and Organization
- **Topics:** Test class per feature class, test file organization, integration vs unit separation
- **Key Content:** `InvoiceControllerTest`, `ProcessPaymentActionTest`, naming conventions
- **Learning Objectives:** Name and organize test classes to clearly map to their source classes and types

### Chunk 3: Feature-Level Test Setup and Shared Fixtures
- **Topics:** Feature-specific `TestCase` base, shared factories, feature-local seeders
- **Key Content:** Base test class per feature, `setUp()` for feature-specific config, factory location
- **Learning Objectives:** Create feature-level test infrastructure that reduces duplication within the feature

### Chunk 4: Test Coverage Expectations Per Feature
- **Topics:** Coverage targets per feature type, CI enforcement, coverage reporting
- **Key Content:** Minimum coverage thresholds, uncovered feature alerts, incremental coverage improvement
- **Learning Objectives:** Set and enforce coverage expectations that are appropriate per feature's complexity and criticality
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization