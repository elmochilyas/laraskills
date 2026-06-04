# ECC Standardized Knowledge — Breaking Change Process

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Breaking Change Process |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

The breaking change process governs how and when breaking changes are introduced to the API. While backward compatibility policy defines what is breaking, this process defines how to approve, communicate, and execute breaking changes. It covers RFC-like proposals, stakeholder review, impact analysis, migration documentation, and coordinated rollout with standard 6-month migration windows.

## Core Concepts

- **Breaking change RFC**: Structured proposal describing the change, rationale, impact analysis, and migration plan.
- **Impact analysis**: Assessment of affected consumers, severity of impact, and migration effort required.
- **Migration guide**: Step-by-step documentation for consumers to migrate from old to new behavior.
- **Change Advisory Board (CAB)**: Cross-functional team reviewing and approving breaking changes (3 engineers + 1 product).
- **Coordinated rollout**: Change deployed alongside old behavior with migration window.
- **Exception process**: Emergency path for security/regulatory breaking changes requiring VP sign-off.

## When To Use

- Any breaking change being introduced to a public API
- Changes affecting multiple consumer integrations
- Modifications requiring consumer action before migration
- API surface changes requiring documentation updates

## When NOT To Use

- Additive-only changes (covered by backward compatibility policy)
- Internal refactoring with no consumer-visible impact
- Emergency security fixes (use exception process)

## Best Practices

- **Impact analysis must be quantitative**: How many consumers affected, at what severity, with what migration effort.
- **Dark launch breaking changes behind feature flags**: Test internally before announcement.
- **RFC before implementation**: Draft RFC, get CAB approval, then implement. Prevents wasted work.
- **Migration guide with tested code examples**: Every code example in the guide must be tested.
- **Consumer outreach for affected consumers**: Individual contact with migration guide and deadline.
- **Post-migration monitoring for 30 days**: Catch any missed consumers after cutoff.

## Architecture Guidelines

- RFC template with standard sections: Context, Proposal, Impact Analysis, Migration Plan, Timeline.
- Versioned coexistence: old and new behavior under different versions during migration window.
- Progressive rollout: 1% -> 5% -> 25% -> 100% of consumers over weeks.
- Feature flag for emergency rollback: keep old behavior available for 30 days post-cutoff.

## Performance Considerations

- Breaking change RFC process is human-driven — no significant performance impact.
- Impact analysis queries consumer registry and request logs — should be async and cached.
- Dark launch feature flags add minimal overhead (single boolean check per request).

## Security Considerations

- Security breaking changes may bypass standard CAB process via exception.
- Migration guides must not expose vulnerability details before patch is deployed.
- Emergency exceptions require VP-level approval and post-incident review.

## Common Mistakes

- Bypassing CAB process for "small" breaking changes.
- Underestimating consumer migration effort (always 2x the estimate).
- Publishing migration guide too technical or too vague.
- Not tracking which consumers have successfully migrated.
- Setting sunset date too early due to internal pressure.

## Anti-Patterns

- **No impact analysis**: Approval granted without knowing how many consumers are affected.
- **CAB as rubber stamp**: No meaningful review; all RFCs approved automatically.
- **Emergency exception abuse**: Bypassing standard process for non-emergency changes.

## Examples

- RFC template: `### Context - ### Proposal - ### Impact Analysis - ### Migration Plan - ### Timeline`.
- CAB SLA: Standard review 48 hours, urgent 24 hours, emergency 4 hours.
- Progressive rollout: Deploy to 1% of consumers -> monitor 24h -> 5% -> 25% -> 100%.

## Related Topics

- **Prerequisites**: Backward Compatibility Policy, Deprecation Policy Design
- **Closely Related**: ADR Process for APIs, Version Retirement Process
- **Advanced**: Automated consumer impact analysis tooling, Breaking change insurance (SLA credits), Multi-team CAB orchestration

## AI Agent Notes

When managing breaking changes: require RFC with impact analysis, obtain CAB approval before implementation, dark launch behind feature flags, create tested migration guide, contact affected consumers individually, progressive rollout, monitor 30 days post-cutoff, maintain rollback capability.

## Verification

Sources: Stripe breaking change RFC process, AWS breaking change blog posts, Shopify breaking changes page, domain-analysis.md.
