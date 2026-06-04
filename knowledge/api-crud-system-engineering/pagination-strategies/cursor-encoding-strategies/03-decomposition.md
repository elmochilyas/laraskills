# Decomposition: Cursor Encoding Strategies

## Topic Overview
Strategies for encoding cursor tokens: base64 JSON, encryption, HMAC signing, binary packing — including security properties, size tradeoffs, and versioning.

## Decomposition Strategy
This KU is a focused exploration of cursor encoding formats and their security/compatibility implications. It is a companion to `cursor-pagination-design`.

## Proposed Folder Structure
```
cursor-encoding-strategies/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Cursor Encoding Strategies
- **Purpose:** Select appropriate cursor encoding format and security measures
- **Difficulty:** Intermediate
- **Dependencies:** Cursor Pagination Design

## Dependency Graph
This KU depends on: Cursor Pagination Design. It serves as prerequisite for: Multi-Column Cursor Pagination, Pagination Link Headers.

## Boundary Analysis
**In scope:** Base64 JSON encoding, encrypted cursors, HMAC-signed cursors, binary encoding, cursor versioning, key rotation, cursor size optimization, validation and error handling.
**Out of scope:** Cursor pagination API design (cursor-pagination-design KU), SQL WHERE clause construction (keyset-pagination-design KU), link header formatting (pagination-link-headers KU).

## Future Expansion Opportunities
None identified — encoding approaches are well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization