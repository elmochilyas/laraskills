# Deprecation Policy Design — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Deprecation lifecycle stages (announce → deprecate → sunset → remove), header injection, consumer notification, grace periods, cutoff enforcement |
| Out-of-Scope | Version numbering schemes, API versioning strategy, changelog format details, rate-limit design |
| External Interfaces | API Gateway (header injection), Notification Service (email/dashboard alerts), Changelog System, Consumer Registry |
| Constraints | Minimum 6-month deprecation window, ISO 8601 dates, all deprecations must include a migration path |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Deprecation policy is a cohesive lifecycle policy — splitting would create circular dependencies |
| Single-responsibility check | Pass | Focuses exclusively on the deprecation lifecycle from announcement to removal |
| Overlap with adjacent KUs | Minimal | Shares notification concerns with Version Retirement Process but governs a distinct lifecycle phase |

## Dependency Graph
```
Backward Compatibility Policy ──┐
                                  ├──→ Deprecation Policy Design ──→ Version Retirement Process
API Changelog Maintenance ───────┘         │
                                            ↓
                                   Breaking Change Process
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should deprecation windows vary by endpoint criticality? | Team discussion | Yes — critical (payments, auth) get 12 months, non-critical get 6 months. |
| How do we handle third-party consumers we cannot contact? | Architecture review | Use mandatory dashboard acknowledgment and public RSS feed. |
| What tooling enforces `Deprecation` / `Sunset` headers? | Implementation review | Custom Laravel middleware scanning `#[Deprecated]` attributes on routes. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization