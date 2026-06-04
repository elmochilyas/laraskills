# Decomposition: custom engine development

## Topic Overview

Scout allows developers to create custom search engines by extending the `Laravel\Scout\Engines\Engine` abstract class. This enables integration with any search backend not natively supported — Elasticsearch, OpenSearch, ClickHouse, Amazon Kendra, or internal proprietary search systems. A custom engine must implement eight required methods covering indexing, deletion, searching, and model mapping.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
custom-engine-development/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### custom engine development
- **Purpose:** Scout allows developers to create custom search engines by extending the `Laravel\Scout\Engines\Engine` abstract class. This enables integration with any search backend not natively supported — Elasticsearch, OpenSearch, ClickHouse, Amazon Kendra, or internal proprietary search systems. A custom engine must implement eight required methods covering indexing, deletion, searching, and model mapping.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), and K013 (Customizing engine searches)

## Dependency Graph
**Depends on:** K001 (Searchable trait), and K013 (Customizing engine searches)
**Depended on by:** Knowledge units that leverage or extend custom engine development patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for custom engine development.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization