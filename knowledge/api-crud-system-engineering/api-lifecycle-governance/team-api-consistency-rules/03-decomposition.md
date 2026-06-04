# Team API Consistency Rules — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Naming conventions, code review checklists, design review process, automated linting rules, consistency scoring, conventions document |
| Out-of-Scope | Specific style guide content (covered in API Style Guide Documentation), OpenAPI spec format details, individual endpoint design decisions |
| External Interfaces | CI/CD Pipeline (Spectral linting), OpenAPI Spec Repository, Code Review Platform (checklist), Developer Portal (published conventions) |
| Constraints | Maximum 30 active rules; all rules must have both human-readable docs and machine-enforceable implementation; rules are versioned with effective dates |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Consistency rules are a single coherent convention system — splitting would create fragmented rule sets |
| Single-responsibility check | Pass | Focuses exclusively on team conventions and enforcement mechanisms |
| Overlap with adjacent KUs | Minimal | Shares style conventions with API Style Guide Doc; review process overlaps with ADR Process |

## Dependency Graph
```
API Style Guide Documentation ──┐
                                  ├──→ Team API Consistency Rules ──→ API Audit Review Process
Backward Compatibility Policy ───┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Who owns the conventions document? | Team governance | Rotating owner each quarter; final authority is the team lead. |
| How do we handle exceptions to rules? | Process definition | Exceptions require a 2-sentence justification in the PR description and expire after 3 months. |
| Should we have team-specific sub-conventions? | Architecture review | Yes — but sub-conventions must not contradict global conventions. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization