# Breaking Change Process — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Breaking change RFC lifecycle, CAB review, impact analysis, migration guide creation, coordinated rollout, post-migration monitoring, exception process |
| Out-of-Scope | Definition of "breaking" (handled by Backward Compatibility Policy), deprecation window details, changelog entry format |
| External Interfaces | Consumer Registry (impact analysis), CI/CD Pipeline (deployment), Developer Portal (migration guide publication), Notification Service |
| Constraints | Every breaking change requires CAB approval; minimum 6-month migration window; exception requires VP sign-off |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | The breaking change lifecycle is a single end-to-end process |
| Single-responsibility check | Pass | Focuses exclusively on the governance process for introducing breaking changes |
| Overlap with adjacent KUs | Moderate | Shares RFC concept with ADR Process; shares migration window with Deprecation Policy |

## Dependency Graph
```
Backward Compatibility Policy ──┐
                                  ├──→ Breaking Change Process ──→ Version Retirement Process
Deprecation Policy Design ───────┘              │
                                                 ↓
ADR Process for APIs ───────────→ Breaking Change RFC (template reuse)
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| What is the SLA for CAB review? | Process definition | 48 hours for standard, 24 hours for urgent, 4 hours for emergency. |
| How do we handle breaking changes that span multiple services? | Architecture review | A single RFC covers the coordinated change across all services. |
| Should we auto-approve low-impact breaking changes? | Policy review | No — all breaking changes require CAB review by policy, but low-impact ones get a streamlined template. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization