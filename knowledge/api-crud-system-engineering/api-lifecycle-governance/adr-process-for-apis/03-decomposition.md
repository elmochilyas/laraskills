# ADR Process for APIs — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | ADR template design, lifecycle management (status transitions), review workflow, storage convention, indexing, supersession handling |
| Out-of-Scope | Specific architectural decisions themselves (contents of individual ADRs), breaking change RFC process (covered by Breaking Change Process) |
| External Interfaces | Code Review Platform (ADR PR reviews), Repository (`docs/adr/`), Documentation Site (published ADRs) |
| Constraints | Each ADR captures exactly one decision; ADRs must be written before or during implementation, not after |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | The ADR process is a single coherent lifecycle from creation to supersession |
| Single-responsibility check | Pass | Focuses exclusively on the ADR process itself, not the decisions documented |
| Overlap with adjacent KUs | Minimal | Shares review workflow with Breaking Change RFC but serves a different purpose (documentation vs governance) |

## Dependency Graph
```
Team API Consistency Rules ─────┐
                                  ├──→ ADR Process for APIs ──→ API Audit Review Process
API Style Guide Documentation ───┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| What decisions require an ADR vs a simple comment? | Team policy | Decisions affecting API surface, security, or performance require ADRs; implementation details do not. |
| How long should ADRs be kept? | Process definition | Indefinitely — old ADRs provide historical context even if superseded. |
| Should we index ADRs by API endpoint? | Architecture review | Yes — add an `affects:` frontmatter field listing affected endpoints for searchability. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization