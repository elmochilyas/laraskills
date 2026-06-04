# API Changelog Maintenance — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Changelog format definition, automated generation from PRs, manual curation workflow, publishing (static + JSON + RSS), archival |
| Out-of-Scope | Deprecation headers, consumer notification system, release process, OpenAPI spec generation |
| External Interfaces | GitHub/Git (PR parsing), CI/CD Pipeline (changelog validation), Developer Portal (publishing), RSS feed readers |
| Constraints | Entries must follow Keep a Changelog v1.1.0 format; every PR with API changes must include a changelog entry |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Changelog maintenance is a single coherent workflow from entry to publication |
| Single-responsibility check | Pass | Focuses exclusively on changelog creation and maintenance |
| Overlap with adjacent KUs | Low | Shares deprecation entry format with Deprecation Policy but is a distinct artifact |

## Dependency Graph
```
Backward Compatibility Policy ──┐
                                  ├──→ API Changelog Maintenance ←── Deprecation Policy Design
API Style Guide Documentation ───┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should we allow consumers to subscribe to specific endpoint changes? | Product review | Yes — implement per-endpoint changelog tagging for filtered subscriptions. |
| How do we handle changelogs for internal (private) endpoints? | Team decision | Internal endpoints use a separate `CHANGELOG-INTERNAL.md` not published to the portal. |
| Should changelog entries be auto-translated for global consumers? | Localization review | No — maintain single English source; community translations are accepted as PRs. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization