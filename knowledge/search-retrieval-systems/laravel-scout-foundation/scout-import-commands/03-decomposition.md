# Decomposition: scout import commands

## Topic Overview

Scout provides artisan commands for batch index management: scout:import (index all records), scout:flush (remove all records from index), scout:sync-index-settings (sync engine-specific config), and scout:delete-all-indexes (remove all indexes).

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


scout-import-commands/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### scout import commands
- **Purpose:** Scout provides artisan commands for batch index management: scout:import (index all records), scout:flush (remove all records from index), scout:sync-index-settings (sync engine-specific config), and scout:delete-all-indexes (remove all indexes).
- **Difficulty:** Foundation
- **Dependencies:** K009, K010

## Dependency Graph
**Depends on:** K009, K010
**Depended on by:** Knowledge units that leverage or extend scout import commands patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for scout import commands.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

? No Knowledge Unit is overloaded

? No major concept is missing

? Boundaries are clear

? Future phases can operate on individual units

? The structure can scale without reorganization
